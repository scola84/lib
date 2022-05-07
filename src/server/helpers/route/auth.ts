import type { Group, Role, Struct, User, UserGroupRole, UserRole, UserToken } from '../../../common'
import { createUserToken, isNil, revive } from '../../../common'
import { parse, serialize } from 'cookie'
import type { RedisClientType } from 'redis'
import type { RouteData } from './handler'
import type { ServerResponse } from 'http'
import type { SqlDatabase } from '../sql'
import { randomBytes } from 'crypto'
import { sql } from '../sql'

export interface RouteAuthOptions {
  backoffExpires?: number
  backoffFactor?: number
  database: SqlDatabase
  entityExpires?: number
  tokenExpires?: number
  tokenLength?: number
  store: RedisClientType
}

export class RouteAuth {
  public backoffExpires: number

  public backoffFactor: number

  public database: SqlDatabase

  public entityExpires: number

  public store: RedisClientType

  public tokenExpires: number

  public tokenLength: number

  public constructor (options: RouteAuthOptions) {
    this.backoffExpires = options.backoffExpires ?? 5 * 60 * 1000
    this.backoffFactor = options.backoffFactor ?? 2
    this.database = options.database
    this.entityExpires = options.entityExpires ?? 5 * 60 * 1000
    this.tokenExpires = options.tokenExpires ?? 5 * 60 * 1000
    this.tokenLength = options.tokenLength ?? 32
    this.store = options.store
  }

  public async authenticate (data: RouteData, response: ServerResponse): Promise<User> {
    const hash = this.getHash(data)

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

    Object.defineProperty(user, 'token', {
      value: userToken,
      writable: true
    })

    if (user.token !== undefined) {
      if (user.token.group_id !== null) {
        user.group_id = user.token.group_id
        user.group = await this.selectGroupFromStore(user.group_id)
      }

      if (user.token.role_id !== null) {
        user.role_id = user.token.role_id
        user.role = await this.selectRoleFromStore(user.role_id)
      }
    }

    return user
  }

  public authorize (data: RouteData, response: ServerResponse, permit?: Struct): void {
    if (data.user === undefined) {
      response.statusCode = 401
      throw new Error('User is undefined')
    }

    if (
      data.user.state_active === false &&
      permit?.inactive === false
    ) {
      response.statusCode = 401
      throw new Error('User is not active')
    }

    if (
      data.user.state_compromised === true &&
      permit?.compromised === false
    ) {
      response.statusCode = 401
      throw new Error('User is compromised')
    }

    const name = `${data.method.toUpperCase()} ${data.url.pathname.toLowerCase()}`

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

  public createUserToken (user: User, expires: number): UserToken {
    return createUserToken({
      date_expires: new Date(Date.now() + expires),
      group_id: user.group?.group_id ?? null,
      hash: randomBytes(this.tokenLength).toString('hex'),
      role_id: user.role?.role_id ?? null,
      user_id: user.user_id
    })
  }

  public getHash (data: RouteData): string | undefined {
    if (data.headers.authorization === undefined) {
      return this.getHashFromCookie(data)
    }

    return this.getHashFromAuthorization(data)
  }

  public getHashFromAuthorization (data: RouteData): string | undefined {
    return data.headers.authorization?.slice(7)
  }

  public getHashFromCookie (data: RouteData): string | undefined {
    const cookie = parse(data.headers.cookie ?? '')

    if (typeof cookie.authorization === 'string') {
      return cookie.authorization
    }

    return undefined
  }

  public async login (response: ServerResponse, user: User): Promise<UserToken> {
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

    const token = this.createUserToken(user, user.role?.expires ?? this.tokenExpires)

    Object.defineProperty(user, 'token', {
      value: token,
      writable: true
    })

    if (user.token !== undefined) {
      await this.insertUserToken(user.token)
      response.setHeader('Set-Cookie', this.createCookie(user.token))
    }

    return token
  }

  public async logout (response: ServerResponse, user?: User): Promise<void> {
    if (user?.token !== undefined) {
      await this.store.del(`sc-auth-token-${user.token.hash}`)
      await this.deleteUserToken(user.token)
    }

    response.setHeader('Set-Cookie', this.createCookie())
  }

  public async setBackoff (data: RouteData, response: ServerResponse): Promise<void> {
    const key = `sc-auth-backoff-${data.ip}`

    const [count] = await this.store
      .multi()
      .incr(key)
      .pExpire(key, this.backoffExpires)
      .exec()

    response.end()
    // setTimeout(() => {
    // }, (this.backoffFactor ** Number(count ?? 0)) * 1000)
  }

  protected async deleteUserToken (userToken: Pick<UserToken, 'token_id'>): Promise<void> {
    await this.database.delete<UserToken>(sql`
      DELETE
      FROM $[user_token]
      WHERE $[token_id] = $(token_id)
    `, {
      token_id: userToken.token_id
    })
  }

  protected async insertUserToken (userToken: UserToken): Promise<Pick<UserToken, 'token_id'>> {
    return this.database.insert<UserToken, Pick<UserToken, 'token_id'>>(sql`
      INSERT INTO $[user_token] (
        $[date_expires],
        $[group_id],
        $[hash],
        $[role_id],
        $[user_id]
      ) VALUES (
        $(date_expires),
        $(group_id),
        $(hash),
        $(role_id),
        $(user_id)
      )
    `, {
      date_expires: userToken.date_expires,
      group_id: userToken.group_id,
      hash: userToken.hash,
      role_id: userToken.role_id,
      user_id: userToken.user_id
    }, 'token_id')
  }

  protected async selectGroupByUser (userId: number): Promise<Group | undefined> {
    return this.database.select<User, Group>(sql`
      SELECT $[group].*
      FROM $[user_group]
      JOIN $[group] USING ($[group_id])
      WHERE $[user_group.user_id] = $(user_id)
      ORDER BY $[group.name]
    `, {
      user_id: userId
    })
  }

  protected async selectGroupFromStore (groupId: number): Promise<Group | undefined> {
    const storedGroup = await this.store.get(`sc-auth-group-${groupId}`)

    if (storedGroup !== null) {
      return JSON.parse(storedGroup, revive) as Group
    }

    const group = await this.database.select<Group, Group>(sql`
      SELECT $[group].*
      FROM $[group]
      WHERE $[group_id] = $(group_id)
    `, {
      group_id: groupId
    })

    if (group !== undefined) {
      await this.store.set(`sc-auth-group-${group.group_id}`, JSON.stringify(group), {
        PX: this.entityExpires
      })
    }

    return group
  }

  protected async selectRoleByUser (userId: number): Promise<Role | undefined> {
    return this.database.select<UserRole, Role>(sql`
      SELECT $[role].*
      FROM $[user_role]
      JOIN $[role] USING ($[role_id])
      WHERE (
        $[user_role.user_id] = $(user_id)
      )
    `, {
      user_id: userId
    })
  }

  protected async selectRoleByUserGroup (userId: number, groupId: number): Promise<Role | undefined> {
    return this.database.select<UserGroupRole, Role>(sql`
      SELECT $[role].*
      FROM $[user_group_role]
      JOIN $[role] USING ($[role_id])
      WHERE (
        $[user_group_role.group_id] = $(group_id) AND
        $[user_group_role.user_id] = $(user_id)
      )
    `, {
      group_id: groupId,
      user_id: userId
    })
  }

  protected async selectRoleFromStore (roleId: number): Promise<Role | undefined> {
    const storedRole = await this.store.get(`sc-auth-role-${roleId}`)

    if (storedRole !== null) {
      return JSON.parse(storedRole, revive) as Role
    }

    const role = await this.database.select<Role, Role>(sql`
      SELECT $[role].*
      FROM $[role]
      WHERE $[role_id] = $(role_id)
    `, {
      role_id: roleId
    })

    if (role !== undefined) {
      await this.store.set(`sc-auth-role-${role.role_id}`, JSON.stringify(role), {
        PX: this.entityExpires
      })
    }

    return role
  }

  protected async selectUserFromStore (userId: number): Promise<User | undefined> {
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
        $[state_compromised],
        $[tel],
        $[user_id],
        $[username]
      FROM $[user]
      WHERE $[user_id] = $(user_id)
    `, {
      user_id: userId
    })

    if (user !== undefined) {
      await this.store.set(`sc-auth-user-${user.user_id}`, JSON.stringify(user), {
        PX: this.entityExpires
      })
    }

    return user
  }

  protected async selectUserTokenByHashFromStore (hash: string): Promise<UserToken | undefined> {
    const storedToken = await this.store.get(`sc-auth-token-${hash}`)

    if (storedToken !== null) {
      return JSON.parse(storedToken, revive) as UserToken
    }

    const userToken = await this.database.select<UserToken, UserToken>(sql`
      SELECT
        $[date_expires],
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

      await this.store.set(`sc-auth-token-${userToken.hash}`, JSON.stringify(userToken), {
        PXAT: userToken.date_expires.valueOf()
      })
    }

    return userToken
  }
}
