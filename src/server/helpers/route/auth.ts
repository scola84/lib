import type { Group, GroupUserRole, Role, User, UserRole, UserToken } from '../../entities'
import { hotp, totp } from 'otplib'
import { isNil, revive } from '../../../common'
import { parse, serialize } from 'cookie'
import { randomBytes, scrypt } from 'crypto'
import type { RedisClientType } from 'redis'
import type { RouteData } from './handler'
import type { ServerResponse } from 'http'
import type { SqlDatabase } from '../sql'
import type { Struct } from '../../../common'
import { createUserToken } from '../../entities'
import { sql } from '../sql'

export interface RouteAuthOptions {
  database: SqlDatabase
  pxBackoff?: number
  pxEntity?: number
  store: RedisClientType
}

export class RouteAuth {
  public database: SqlDatabase

  public pxBackoff: number

  public pxEntity: number

  public store: RedisClientType

  public constructor (options: RouteAuthOptions) {
    this.database = options.database
    this.pxBackoff = options.pxBackoff ?? 24 * 60 * 60 * 1000
    this.pxEntity = options.pxEntity ?? 60 * 60 * 1000
    this.store = options.store
  }

  public async authenticate (data: RouteData, response: ServerResponse): Promise<User> {
    const hash = this.extractTokenHash(data)

    if (hash === undefined) {
      response.statusCode = 401
      throw new Error('Hash is undefined')
    }

    const userToken = await this.selectUserTokenByHashFromStore(hash)

    if (isNil(userToken)) {
      response.statusCode = 401
      throw new Error('Token is undefined')
    }

    userToken.hash = hash

    if (userToken.date_expires < new Date()) {
      response.statusCode = 401
      throw new Error('Token is expired')
    }

    const user = await this.selectUserFromStore(userToken.user_id)

    if (user === undefined) {
      response.statusCode = 401
      throw new Error('User is undefined')
    }

    user.token = userToken

    if (user.token.group_id !== null) {
      user.group_id = user.token.group_id
      user.group = await this.selectGroupFromStore(user.group_id)
    }

    if (user.token.role_id !== null) {
      user.role_id = user.token.role_id
      user.role = await this.selectRoleFromStore(user.role_id)
    }

    return user
  }

  public authorize (data: RouteData, response: ServerResponse, permit?: Struct): void {
    if (data.user === undefined) {
      response.statusCode = 401
      throw new Error('User is undefined')
    }

    if (
      !data.user.state_active &&
      permit?.inactive === false
    ) {
      response.statusCode = 403
      throw new Error('User is not active')
    }

    if (
      data.user.state_compromised &&
      permit?.compromised === false
    ) {
      response.statusCode = 403
      throw new Error('User is compromised')
    }

    if (
      !data.user.state_confirmed &&
      permit?.unconfirmed === false
    ) {
      response.statusCode = 403
      throw new Error('User is not confirmed')
    }

    const name = `${data.method}${data.url.pathname}`

    if (
      data.user.role?.permissions[name] !== true &&
      data.user.token?.permissions?.[name] !== true
    ) {
      response.statusCode = 403
      throw new Error('User is not permitted')
    }
  }

  public async clearBackoff (data: RouteData): Promise<void> {
    await this.store.del(`sc-auth-backoff-${data.ip}`)
  }

  public createCookie (userToken?: UserToken): string {
    return serialize('authorization', userToken?.hash ?? '', {
      expires: userToken?.date_expires ?? new Date(0),
      httpOnly: true,
      path: '/',
      sameSite: true,
      secure: true
    })
  }

  public createUserToken (user: User, expires = user.role?.expires ?? 0): UserToken {
    return createUserToken({
      date_expires: new Date(Date.now() + expires),
      group_id: user.group?.group_id ?? null,
      hash: randomBytes(64).toString('hex'),
      role_id: user.role?.role_id ?? null,
      user_id: user.user_id
    })
  }

  public async deleteUserToken (userToken: UserToken): Promise<void> {
    await this.database.delete<UserToken>(sql`
      DELETE
      FROM $[user_token]
      WHERE $[token_id] = $(token_id)
    `, userToken)
  }

  public extractTokenHash (data: RouteData): string | undefined {
    if (data.headers.authorization === undefined) {
      const cookie = parse(data.headers.cookie ?? '')

      if (typeof cookie.authorization === 'string') {
        return cookie.authorization
      }
    } else {
      return data.headers.authorization.slice(7)
    }

    return undefined
  }

  public async hashPassword (password: string): Promise<string> {
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

  public async insertUserToken (userToken: Partial<UserToken>): Promise<Pick<UserToken, 'token_id'>> {
    return this.database.insert<UserToken, Pick<UserToken, 'token_id'>>(sql`
      INSERT INTO $[user_token] (
        $[expires],
        $[group_id],
        $[role_id],
        $[token],
        $[user_id]
      ) VALUES (
        $(expires),
        $(group_id),
        $(role_id),
        $(token),
        $(user_id)
      )
    `, userToken, 'token_id')
  }

  public async login (response: ServerResponse, user: User): Promise<void> {
    if (user.group === undefined) {
      user.group = await this.selectGroupByUser(user.user_id)
      user.group_id = user.group?.group_id
    }

    if (user.role === undefined) {
      if (user.group === undefined) {
        user.role = await this.selectRoleByUser(user.user_id)
      } else {
        user.role = await this.selectRoleByUserGroup(user.user_id, user.group.group_id)
      }

      user.role_id = user.role?.role_id
    }

    user.token = this.createUserToken(user)
    await this.insertUserToken(user.token)
    response.setHeader('Set-Cookie', this.createCookie(user.token))
  }

  public async logout (response: ServerResponse, user?: User): Promise<void> {
    if (user?.token !== undefined) {
      await this.store.del(`sc-auth-token-${user.token.hash}`)
      await this.deleteUserToken(user.token)
    }

    response.setHeader('Set-Cookie', this.createCookie())
  }

  public async selectGroupByUser (userId: number | string): Promise<Group | undefined> {
    return this.database.select<User, Group>(sql`
      SELECT $[group].*,
      FROM $[group_user]
      JOIN $[group] USING ($[user_id])
      WHERE $[group_user.user_id] = $(user_id)
      ORDER BY $[group.name]
      LIMIT 0, 1
    `, {
      user_id: userId
    })
  }

  public async selectGroupFromStore (groupId: number | string): Promise<Group | undefined> {
    const storedGroup = await this.store.get(`sc-auth-group-${groupId}`)

    if (storedGroup !== null) {
      return JSON.parse(storedGroup, revive) as Group
    }

    const group = await this.database.select<Group, Group>(sql`
      SELECT *
      FROM $[group]
      WHERE $[group_id] = $(group_id)
    `, {
      group_id: groupId
    })

    if (group !== undefined) {
      await this.store.set(`sc-auth-group-${groupId}`, JSON.stringify(group), {
        PX: this.pxEntity.valueOf()
      })
    }

    return group
  }

  public async selectRoleByUser (userId: number | string): Promise<Role | undefined> {
    return this.database.select<UserRole, Role>(sql`
      SELECT $[role].*,
      FROM $[user_role]
      JOIN $[role] USING ($[role_id])
      WHERE (
        $[user_role.user_id] = $(user_id)
      )
    `, {
      user_id: userId
    })
  }

  public async selectRoleByUserGroup (userId: number | string, groupId: number | string): Promise<Role | undefined> {
    return this.database.select<GroupUserRole, Role>(sql`
      SELECT $[role].*,
      FROM $[group_user_role]
      JOIN $[role] USING ($[role_id])
      WHERE (
        $[group_user_role.group_id] = $(group_id) AND
        $[group_user_role.user_id] = $(user_id)
      )
    `, {
      group_id: groupId,
      user_id: userId
    })
  }

  public async selectRoleFromStore (roleId: number | string): Promise<Role | undefined> {
    const storedRole = await this.store.get(`sc-auth-role-${roleId}`)

    if (storedRole !== null) {
      return JSON.parse(storedRole, revive) as Role
    }

    const role = await this.database.select<Role, Role>(sql`
      SELECT *
      FROM $[role]
      WHERE $[role_id] = $(role_id)
    `, {
      role_id: roleId
    })

    if (role !== undefined) {
      await this.store.set(`sc-auth-role-${roleId}`, JSON.stringify(role), {
        PX: this.pxEntity
      })
    }

    return role
  }

  public async selectUser (userId: number | string): Promise<User | undefined> {
    return this.database.select<User, User>(sql`
      SELECT *
      FROM $[user]
      WHERE $[user_id] = $(user_id)
    `, {
      user_id: userId
    })
  }

  public async selectUserByUsername (identity: string): Promise<User | undefined> {
    return this.database.select<User, User>(sql`
      SELECT *,
      FROM $[user]
      WHERE
        $[email] = $(email) OR
        $[tel] = $(tel) OR
        $[username] = $(username)
    `, {
      email: identity,
      tel: identity,
      username: identity
    })
  }

  public async selectUserFromStore (userId: number | string): Promise<User | undefined> {
    const storedUser = await this.store.get(`sc-auth-user-${userId}`)

    if (storedUser !== null) {
      return JSON.parse(storedUser, revive) as User
    }

    const user = await this.database.select<User, User>(sql`
      SELECT
        $[auth_mfa],
        $[email],
        $[name],
        $[preferences],
        $[state_active],
        $[state_confirmed],
        $[tel],
        $[user_id],
        $[username]
      FROM $[user]
      WHERE $[user_id] = $(user_id)
    `, {
      user_id: userId
    })

    if (user !== undefined) {
      await this.store.set(`sc-auth-user-${userId}`, JSON.stringify(user), {
        PX: this.pxEntity
      })
    }

    return user
  }

  public async selectUserTokenByHashFromStore (hash: string): Promise<UserToken | undefined> {
    const storedToken = await this.store.get(`sc-auth-token-${hash}`)

    if (storedToken !== null) {
      return JSON.parse(storedToken, revive) as UserToken
    }

    const userToken = await this.database.select<UserToken, UserToken>(sql`
      SELECT
        $[expires],
        $[group_id],
        $[role_id],
        $[permissions],
        $[token_id],
        $[user_id]
      FROM $[user_token]
      WHERE $[hash] = $(hash)
    `, {
      hash
    })

    if (userToken !== undefined) {
      userToken.hash = hash

      await this.store.set(`sc-auth-token-${hash}`, JSON.stringify(userToken), {
        PXAT: userToken.date_expires.valueOf()
      })
    }

    return userToken
  }

  public async setBackoff (data: RouteData, response: ServerResponse): Promise<void> {
    const key = `sc-auth-backoff-${data.ip}`

    const [count] = await this.store
      .multi()
      .incr(key)
      .pExpire(key, this.pxBackoff)
      .exec()

    setTimeout(() => {
      response.end()
    }, (2 ** Number(count ?? 0)) * 1000)
  }

  public async updateUserCodes (user: User): Promise<void> {
    await this.database.update<User>(sql`
      UPDATE $[user]
      SET $[auth_codes] = $(auth_codes)
      WHERE $[user_id] = $(user_id)
    `, {
      auth_codes: user.auth_codes,
      user_id: user.user_id
    })
  }

  public validateCode (user: User, code: string): boolean {
    const codes = user.auth_codes?.split(/\n+/u)
    const index = codes?.indexOf(code) ?? -1

    if (index !== -1) {
      user.auth_codes = codes
        ?.splice(index, 1)
        .join('\n') ?? null

      return true
    }

    return false
  }

  public validateHotp (user: User, otp: string): boolean {
    const [secret = '', counter = 0] = user.auth_hotp?.split(':') ?? []
    return hotp.check(otp, secret, Number(counter))
  }

  public async validatePassword (user: User, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const [salt, key] = user.auth_password?.split(':') ?? []

      scrypt(password, salt, 64, (error, derivedKey) => {
        if (error === null) {
          resolve(key === derivedKey.toString('hex'))
        } else {
          reject(error)
        }
      })
    })
  }

  public validateTotp (user: User, otp: string): boolean {
    return totp.check(otp, user.auth_totp ?? '')
  }
}
