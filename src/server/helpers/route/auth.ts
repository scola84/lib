import type { Group, Role, User, UserGroup, UserGroupRole, UserRole, UserToken } from '../../entities'
import { HOTP, Secret, TOTP } from 'otpauth'
import { isNil, revive } from '../../../common'
import { parse, serialize } from 'cookie'
import { randomBytes, scrypt, timingSafeEqual } from 'crypto'
import type { RedisClientType } from 'redis'
import type { RouteData } from './handler'
import type { ServerResponse } from 'http'
import type { SqlDatabase } from '../sql'
import type { Struct } from '../../../common'
import { createUserToken } from '../../entities'
import { sql } from '../sql'

export interface RouteAuthOptions {
  backoffExpires?: number
  backoffFactor?: number
  codesCount?: number
  codesLength?: number[]
  database: SqlDatabase
  entityExpires?: number
  hotp?: typeof HOTP.defaults
  loginExpires?: number
  passwordLength?: number
  saltLength?: number
  tokenLength?: number
  totp?: typeof TOTP.defaults
  store: RedisClientType
}

export class RouteAuth {
  public backoffExpires: number

  public backoffFactor: number

  public codesCount: number

  public codesLength: number[]

  public database: SqlDatabase

  public entityExpires: number

  public hotp: typeof HOTP.defaults

  public loginExpires: number

  public passwordLength: number

  public saltLength: number

  public store: RedisClientType

  public tokenLength: number

  public totp: typeof TOTP.defaults

  public constructor (options: RouteAuthOptions) {
    this.backoffExpires = options.backoffExpires ?? 5 * 60 * 1000
    this.backoffFactor = options.backoffFactor ?? 2
    this.codesCount = options.codesCount ?? 5
    this.codesLength = options.codesLength ?? [5]
    this.database = options.database
    this.entityExpires = options.entityExpires ?? 5 * 60 * 1000
    this.hotp = options.hotp ?? HOTP.defaults
    this.loginExpires = options.loginExpires ?? 5 * 60 * 1000
    this.passwordLength = options.passwordLength ?? 64
    this.saltLength = options.saltLength ?? 8
    this.tokenLength = options.tokenLength ?? 32
    this.totp = options.totp ?? TOTP.defaults
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

    if (
      data.user.state_confirmed === false &&
      permit?.unconfirmed === false
    ) {
      response.statusCode = 401
      throw new Error('User is not confirmed')
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

  public createCodes (): string {
    return new Array(this.codesCount)
      .fill('')
      .map(() => {
        return this.codesLength
          .map((length) => {
            return randomBytes(length).toString('hex')
          })
          .join('-')
      })
      .join('\n')
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

  public createHotp (): HOTP {
    return new HOTP({
      ...this.hotp,
      counter: Math.round(Math.random() * 1000 * 1000)
    })
  }

  public async createPassword (password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = randomBytes(this.saltLength)

      scrypt(password, salt, this.passwordLength, (error, derivedKey) => {
        if (error === null) {
          resolve(`${salt.toString('hex')}:${derivedKey.toString('hex')}`)
        } else {
          reject(error)
        }
      })
    })
  }

  public createTotp (): TOTP {
    return new TOTP({
      ...this.totp
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

  public async deleteUser (user: User): Promise<void> {
    await this.database.delete<User>(sql`
      DELETE
      FROM $[user]
      WHERE $[user_id] = $(user_id)
    `, {
      user_id: user.user_id
    })
  }

  public async deleteUserToken (userToken: UserToken): Promise<void> {
    await this.database.delete<UserToken>(sql`
      DELETE
      FROM $[user_token]
      WHERE $[token_id] = $(token_id)
    `, {
      token_id: userToken.token_id
    })
  }

  public async getDelTmpUser (hash: string): Promise<User | null> {
    const user = await this.store.getDel(`sc-auth-tmp-user-${hash}`)

    if (user !== null) {
      return JSON.parse(user) as User
    }

    return null
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

  public async insertUser (user: User): Promise<Pick<User, 'user_id'>> {
    return this.database.insert<User, Pick<User, 'user_id'>>(sql`
      INSERT INTO $[user] (
        $[auth_password],
        $[email],
        $[name],
        $[preferences],
        $[tel],
        $[username]
      ) VALUES (
        $(auth_password),
        $(email),
        $(name),
        $(preferences),
        $(tel),
        $(username)
      )
    `, {
      auth_password: user.auth_password,
      email: user.email,
      name: user.name,
      preferences: user.preferences,
      tel: user.tel,
      username: user.username
    }, 'user_id')
  }

  public async insertUserGroup (userGroup: UserGroup): Promise<void> {
    await this.database.insert<UserGroup>(sql`
      INSERT INTO $[user_group] (
        $[group_id],
        $[user_id]
      ) VALUES (
        $(group_id),
        $(user_id)
      )
    `, {
      group_id: userGroup.group_id,
      user_id: userGroup.user_id
    }, null)
  }

  public async insertUserRole (userRole: UserRole): Promise<void> {
    await this.database.insert<UserRole>(sql`
      INSERT INTO $[user_role] (
        $[role_id],
        $[user_id]
      ) VALUES (
        $(role_id),
        $(user_id)
      )
    `, {
      role_id: userRole.role_id,
      user_id: userRole.user_id
    }, null)
  }

  public async insertUserToken (userToken: UserToken): Promise<Pick<UserToken, 'token_id'>> {
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

  public async login (response: ServerResponse, user: User): Promise<UserToken> {
    await this.logout(response, user)

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

    const token = this.createUserToken(user, user.role?.expires ?? this.loginExpires)

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

  public async register (user: User): Promise<void> {
    user.user_id = (await this.insertUser(user)).user_id

    const [
      group,
      role
    ] = await Promise.all([
      this.selectGroupForRegister(),
      this.selectRoleForRegister()
    ])

    if (group !== undefined) {
      user.group = group

      await this.insertUserGroup({
        group_id: group.group_id,
        user_id: user.user_id
      })
    }

    if (role !== undefined) {
      user.role = role

      await this.insertUserRole({
        role_id: role.role_id,
        user_id: user.user_id
      })
    }
  }

  public async selectGroupByUser (userId: number): Promise<Group | undefined> {
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

  public async selectGroupForConfirm (): Promise<Group | undefined> {
    return this.database.select<Group, Group>(sql`
      SELECT $[group].*
      FROM $[group]
      WHERE $[for_confirm] = $(for_confirm)
    `, {
      for_confirm: true
    })
  }

  public async selectGroupForRegister (): Promise<Group | undefined> {
    return this.database.select<Group, Group>(sql`
      SELECT $[group].*
      FROM $[group]
      WHERE $[for_register] = $(for_register)
    `, {
      for_register: true
    })
  }

  public async selectGroupFromStore (groupId: number): Promise<Group | undefined> {
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
      await this.setGroup(group)
    }

    return group
  }

  public async selectRoleByUser (userId: number): Promise<Role | undefined> {
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

  public async selectRoleByUserGroup (userId: number, groupId: number): Promise<Role | undefined> {
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

  public async selectRoleForConfirm (): Promise<Role | undefined> {
    return this.database.select<Role, Role>(sql`
      SELECT $[role].*
      FROM $[role]
      WHERE $[for_confirm] = $(for_confirm)
    `, {
      for_confirm: true
    })
  }

  public async selectRoleForRegister (): Promise<Role | undefined> {
    return this.database.select<Role, Role>(sql`
      SELECT $[role].*
      FROM $[role]
      WHERE $[for_register] = $(for_register)
    `, {
      for_register: true
    })
  }

  public async selectRoleFromStore (roleId: number): Promise<Role | undefined> {
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
      await this.setRole(role)
    }

    return role
  }

  public async selectUser (userId: number): Promise<User | undefined> {
    return this.database.select<User, User>(sql`
      SELECT $[user].*
      FROM $[user]
      WHERE $[user_id] = $(user_id)
    `, {
      user_id: userId
    })
  }

  public async selectUserByIdentities (user: Pick<User, 'email' | 'tel' | 'username'>): Promise<User | undefined> {
    return this.database.select<User, User>(sql`
      SELECT $[user].*
      FROM $[user]
      WHERE
        $[email] = $(email) OR
        $[tel] = $(tel) OR
        $[username] = $(username)
    `, {
      email: user.email,
      tel: user.tel,
      username: user.username
    })
  }

  public async selectUserByIdentity (identity: string): Promise<User | undefined> {
    return this.database.select<User, User>(sql`
      SELECT $[user].*
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

  public async selectUserFromStore (userId: number): Promise<User | undefined> {
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
      await this.setUser(user)
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
      await this.setUserToken(userToken)
    }

    return userToken
  }

  public async setBackoff (data: RouteData, response: ServerResponse): Promise<void> {
    const key = `sc-auth-backoff-${data.ip}`

    const [count] = await this.store
      .multi()
      .incr(key)
      .pExpire(key, this.backoffExpires)
      .exec()

    setTimeout(() => {
      response.end()
    }, (this.backoffFactor ** Number(count ?? 0)) * 1000)
  }

  public async setGroup (group: Group): Promise<void> {
    await this.store.set(`sc-auth-group-${group.group_id}`, JSON.stringify(group), {
      PX: this.entityExpires
    })
  }

  public async setRole (role: Role): Promise<void> {
    await this.store.set(`sc-auth-role-${role.role_id}`, JSON.stringify(role), {
      PX: this.entityExpires
    })
  }

  public async setTmpUser (user: User, token: UserToken): Promise<void> {
    await this.store.set(`sc-auth-tmp-user-${token.hash}`, JSON.stringify(user), {
      PXAT: token.date_expires.valueOf()
    })
  }

  public async setUser (user: User): Promise<void> {
    await this.store.set(`sc-auth-user-${user.user_id}`, JSON.stringify(user), {
      PX: this.entityExpires
    })
  }

  public async setUserToken (userToken: UserToken): Promise<void> {
    await this.store.set(`sc-auth-token-${userToken.hash}`, JSON.stringify(userToken), {
      PXAT: userToken.date_expires.valueOf()
    })
  }

  public async updateUserCodes (user: Pick<User, 'auth_codes_confirmed' | 'auth_codes' | 'user_id'>): Promise<void> {
    await this.database.update<User>(sql`
      UPDATE $[user]
      SET 
        $[auth_codes] = $(auth_codes),
        $[auth_codes_confirmed] = $(auth_codes_confirmed)
      WHERE $[user_id] = $(user_id)
    `, {
      auth_codes: user.auth_codes,
      auth_codes_confirmed: user.auth_codes_confirmed,
      user_id: user.user_id
    })
  }

  public async updateUserHotp (user: User): Promise<void> {
    if (user.auth_hotp_email_confirmed !== null) {
      await this.updateUserHotpEmail({
        auth_hotp_email: user.auth_hotp_email,
        auth_hotp_email_confirmed: user.auth_hotp_email_confirmed,
        user_id: user.user_id
      })
    } else if (user.auth_hotp_tel_confirmed !== null) {
      await this.updateUserHotpTel({
        auth_hotp_tel: user.auth_hotp_tel,
        auth_hotp_tel_confirmed: user.auth_hotp_tel_confirmed,
        user_id: user.user_id
      })
    }
  }

  public async updateUserHotpEmail (user: Pick<User, 'auth_hotp_email_confirmed' | 'auth_hotp_email' | 'user_id'>): Promise<void> {
    await this.database.update<User>(sql`
      UPDATE $[user]
      SET
        $[auth_hotp_email] = $(auth_hotp_email),
        $[auth_hotp_email_confirmed] = $(auth_hotp_email_confirmed)
      WHERE $[user_id] = $(user_id)
    `, {
      auth_hotp_email: user.auth_hotp_email,
      auth_hotp_email_confirmed: user.auth_hotp_email_confirmed,
      user_id: user.user_id
    })
  }

  public async updateUserHotpTel (user: Pick<User, 'auth_hotp_tel_confirmed' | 'auth_hotp_tel' | 'user_id'>): Promise<void> {
    await this.database.update<User>(sql`
      UPDATE $[user]
      SET
        $[auth_hotp_tel] = $(auth_hotp_tel),
        $[auth_hotp_tel_confirmed] = $(auth_hotp_tel_confirmed)
      WHERE $[user_id] = $(user_id)
    `, {
      auth_hotp_tel: user.auth_hotp_tel,
      auth_hotp_tel_confirmed: user.auth_hotp_tel_confirmed,
      user_id: user.user_id
    })
  }

  public async updateUserPassword (user: Pick<User, 'auth_password' | 'user_id'>): Promise<void> {
    await this.database.update<User>(sql`
      UPDATE $[user]
      SET $[auth_password] = $(auth_password)
      WHERE $[user_id] = $(user_id)
    `, {
      auth_password: user.auth_password,
      user_id: user.user_id
    })
  }

  public async updateUserTotp (user: Pick<User, 'auth_totp_confirmed' | 'auth_totp' | 'user_id'>): Promise<void> {
    await this.database.update<User>(sql`
      UPDATE $[user]
      SET
        $[auth_totp] = $(auth_totp),
        $[auth_totp_confirmed] = $(auth_totp_confirmed)
      WHERE $[user_id] = $(user_id)
    `, {
      auth_totp: user.auth_totp,
      auth_totp_confirmed: user.auth_totp_confirmed,
      user_id: user.user_id
    })
  }

  public validateCode (user: User, code: string): boolean {
    const codes = user.auth_codes?.split(/\n+/u)
    const index = codes?.indexOf(code) ?? -1

    if (index !== -1) {
      codes?.splice(index, 1)
      user.auth_codes = codes?.join('\n') ?? null
      return true
    }

    return false
  }

  public validateHotp (user: User, otp: string): boolean {
    const [
      secret = '',
      counter = 0
    ] = user.auth_hotp?.split(':') ?? []

    return HOTP.validate({
      ...this.hotp,
      counter: Number(counter),
      secret: Secret.fromBase32(secret),
      token: otp
    }) !== null
  }

  public async validatePassword (user: User, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const [salt, key] = user.auth_password
        ?.split(':')
        .map((value) => {
          return Buffer.from(value, 'hex')
        }) ?? []

      scrypt(password, salt, this.passwordLength, (error, derivedKey) => {
        if (error === null) {
          resolve(timingSafeEqual(key, derivedKey))
        } else {
          reject(error)
        }
      })
    })
  }

  public validateTotp (user: User, otp: string): boolean {
    const delta = TOTP.validate({
      ...this.totp,
      secret: Secret.fromBase32(user.auth_totp ?? ''),
      token: otp
    })

    return delta !== null
  }
}
