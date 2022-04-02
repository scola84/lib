import type { GroupUserRole, Role, User, UserToken } from '../../entities'
import type { IncomingHttpHeaders, ServerResponse } from 'http'
import { isStruct, revive } from '../../../common'
import { parse, serialize } from 'cookie'
import { randomBytes, scrypt } from 'crypto'
import type { RedisClientType } from 'redis'
import type { RouteData } from './handler'
import type { SqlDatabase } from '../sql'
import { createUserToken } from '../../entities'
import { sql } from '../sql'

export interface RouteAuthOptions {
  database: SqlDatabase
  store?: RedisClientType
}

export class RouteAuth {
  public database: SqlDatabase

  public store?: RedisClientType

  public constructor (options: RouteAuthOptions) {
    this.database = options.database
    this.store = options.store
  }

  public async authenticate (data: RouteData): Promise<User> {
    let hash = ''

    if (data.headers.authorization === undefined) {
      const cookie = parse(data.headers.cookie ?? '')

      if (typeof cookie.token === 'string') {
        hash = cookie.token
      }
    } else {
      hash = data.headers.authorization.slice(7)
    }

    if (hash === '') {
      throw new Error('Hash is undefined')
    }

    const storeUser = await this.store?.hGet('sc-auth', hash)

    if (storeUser !== undefined) {
      return JSON.parse(storeUser, revive) as User
    }

    const token = await this.selectUserTokenByHash(hash)

    if (token === undefined) {
      throw new Error('Token is undefined')
    }

    const user = await this.selectUser(token.user_id)

    if (user === undefined) {
      throw new Error('User is undefined')
    }

    data.user = user

    const role = await this.selectRoleByUserGroup(user.user_id, user.group_id)

    if (role === undefined) {
      throw new Error('Role is undefined')
    }

    user.role = role
    user.token = token
    await this.store?.hSet('sc-auth', user.token.hash, JSON.stringify(user))
    return user
  }

  public authorize (data: RouteData): void {
    if (data.user === undefined) {
      throw new Error('User is undefined')
    }

    if (!data.user.active) {
      throw new Error('User is not active')
    }

    const { token } = data.user

    if (token === undefined) {
      throw new Error('Token is undefined')
    }

    if (token.expires < new Date()) {
      throw new Error('Token date is invalid')
    }

    if (
      data.user.role.ip &&
      token.ip !== data.headers['x-real-ip']
    ) {
      throw new Error('Token IP is invalid')
    }

    const methods = token.permissions[data.url.pathname]

    if (typeof methods !== 'string') {
      throw new Error('Path is not permitted')
    }

    if (!methods.includes(data.method)) {
      throw new Error('Method is not permitted')
    }
  }

  public async getUser (data: RouteData): Promise<User> {
    if (
      isStruct(data.body) &&
      typeof data.body.username === 'string' &&
      typeof data.body.password === 'string'
    ) {
      const user = await this.selectUserByUsername(data.body.username)

      if (user === undefined) {
        throw new Error('User is undefined')
      }

      data.user = user

      if (!user.active) {
        throw new Error('User is not active')
      }

      if (!(await this.validatePassword(user, data.body.password))) {
        throw new Error('Password is invalid')
      }

      user.group_id = user.groups?.split(',')[0] ?? 0
      return user
    }

    throw new Error('Credentials are undefined')
  }

  public async login (data: RouteData, response: ServerResponse): Promise<void> {
    const {
      headers,
      user
    } = data

    if (user === undefined) {
      throw new Error('User is undefined')
    }

    const role = await this.selectRoleByUserGroup(user.user_id, user.group_id)

    if (role === undefined) {
      throw new Error('Role is undefined')
    }

    user.role = role
    user.token = this.createUserToken(user, headers)
    user.token.token_id = (await this.insertUserToken(user.token)).token_id
    await this.store?.hSet('sc-auth', user.token.hash, JSON.stringify(user))
    response.setHeader('Set-Cookie', this.createCookie(user.token))
  }

  public async logout (data: RouteData, response: ServerResponse): Promise<void> {
    const { token } = data.user ?? {}

    if (token !== undefined) {
      await this.deleteUserToken(token)
      await this.store?.hDel('sc-auth', token.hash)
    }

    response.setHeader('Set-Cookie', this.createCookie())
  }

  protected createCookie (token?: UserToken): string {
    return serialize('token', token?.hash ?? '', {
      expires: token?.expires ?? new Date(0),
      httpOnly: true,
      path: '/',
      sameSite: true,
      secure: true
    })
  }

  protected createUserToken (user: User, headers: IncomingHttpHeaders): UserToken {
    return createUserToken({
      expires: new Date(Date.now() + user.role.validity),
      group_id: user.group_id,
      hash: randomBytes(64).toString('hex'),
      ip: headers['x-real-ip']?.toString(),
      permissions: user.role.permissions,
      user_id: user.user_id
    })
  }

  protected async deleteUserToken (userToken: Partial<UserToken>): Promise<void> {
    await this.database.delete<UserToken>(sql`
      DELETE
      FROM $[user_token]
      WHERE $[token_id] = $(token_id)
    `, userToken)
  }

  protected async hashPassword (password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = randomBytes(8).toString('hex')

      scrypt(password, salt, 64, (error, derivedKey) => {
        if (error === null) {
          resolve(`${salt}:${derivedKey.toString('hex')}`)
        } else {
          reject(error)
        }
      })
    })
  }

  protected async insertUserToken (userToken: Partial<UserToken>): Promise<Pick<UserToken, 'token_id'>> {
    return this.database.insert<UserToken, Pick<UserToken, 'token_id'>>(sql`
      INSERT INTO $[user_token] (
        $[expires],
        $[group_id],
        $[token],
        $[user_id]
      ) VALUES (
        $(expires),
        $(group_id),
        $(token),
        $(user_id)
      )
    `, userToken, 'token_id')
  }

  protected async selectRoleByUserGroup (userId: number | string, groupId: number | string): Promise<Role | undefined> {
    return this.database.select<GroupUserRole, Role>(sql`
      SELECT $[role].*,
      FROM $[group_user_role]
      JOIN $[role] USING ($[role])
      WHERE (
        $[group_user_role.group_id] = $(group_id) AND
        $[group_user_role.user_id] = $(user_id)
      )
    `, {
      group_id: groupId,
      user_id: userId
    })
  }

  protected async selectUser (id: number | string): Promise<User | undefined> {
    return this.database.select<User, User>(sql`
      SELECT
        $[user].*,
        GROUP_CONCAT($[group_user.group_id]) AS $[groups]
      FROM $[user]
      JOIN $[group_user] USING ($[user_id])
      WHERE $[user.user_id] = $(id)
    `, {
      user_id: id
    })
  }

  protected async selectUserByUsername (username: string): Promise<User | undefined> {
    return this.database.select<User, User>(sql`
      SELECT
        $[user].*,
        GROUP_CONCAT($[group_user.group_id]) AS $[groups]
      FROM $[user]
      JOIN $[group_user] USING ($[user_id])
      WHERE $[user.username] = $(username)
    `, {
      username
    })
  }

  protected async selectUserTokenByHash (hash: string): Promise<UserToken | undefined> {
    return this.database.select<UserToken, UserToken>(sql`
      SELECT *
      FROM $[user_token]
      WHERE $[hash] = $(hash)
    `, {
      hash
    })
  }

  protected async validatePassword (user: User, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const [salt, key] = user.hash.split(':')

      scrypt(password, salt, 64, (error, derivedKey) => {
        if (error === null) {
          resolve(key === derivedKey.toString('hex'))
        } else {
          reject(error)
        }
      })
    })
  }
}
