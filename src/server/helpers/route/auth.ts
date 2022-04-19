import type { Group, Role, User, UserGroupRole, UserRole, UserToken } from '../../entities'
import { HOTP, Secret, TOTP } from 'otpauth'
import { isNil, revive } from '../../../common'
import { parse, serialize } from 'cookie'
import { randomBytes, scrypt, timingSafeEqual } from 'crypto'
import type { RedisClientType } from 'redis'
import type { RouteData } from './handler'
import type { ServerResponse } from 'http'
import type { Sms } from '../sms'
import type { Smtp } from '../smtp'
import type { SqlDatabase } from '../sql'
import type { Struct } from '../../../common'
import { createUserToken } from '../../entities'
import { sql } from '../sql'

export interface RouteAuthOptions {
  backoffExpires?: number
  backoffFactor?: number
  database: SqlDatabase
  entityExpires?: number
  factorExpires?: number
  hotp?: typeof HOTP.defaults
  loginExpires?: number
  passwordLength?: number
  saltLength?: number
  sms?: Sms
  smtp?: Smtp
  totp?: typeof TOTP.defaults
  tokenLength?: number
  store: RedisClientType
}

export class RouteAuth {
  public backoffExpires: number

  public backoffFactor: number

  public database: SqlDatabase

  public entityExpires: number

  public factorExpires: number

  public hotp: typeof HOTP.defaults

  public loginExpires: number

  public passwordLength: number

  public saltLength: number

  public sms?: Sms

  public smtp?: Smtp

  public store: RedisClientType

  public tokenLength: number

  public totp: typeof TOTP.defaults

  public constructor (options: RouteAuthOptions) {
    this.backoffExpires = options.backoffExpires ?? 5 * 60 * 1000
    this.backoffFactor = options.backoffFactor ?? 2
    this.database = options.database
    this.entityExpires = options.entityExpires ?? 5 * 60 * 1000
    this.factorExpires = options.factorExpires ?? 5 * 60 * 1000
    this.hotp = options.hotp ?? HOTP.defaults
    this.loginExpires = options.loginExpires ?? 5 * 60 * 1000
    this.passwordLength = options.passwordLength ?? 64
    this.saltLength = options.saltLength ?? 8
    this.sms = options.sms
    this.smtp = options.smtp
    this.tokenLength = options.tokenLength ?? 32
    this.totp = options.totp ?? TOTP.defaults
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

    Object.defineProperty(user, 'token', {
      value: userToken
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

  public async deleteUserToken (userToken: UserToken): Promise<void> {
    await this.database.delete<UserToken>(sql`
      DELETE
      FROM $[user_token]
      WHERE $[token_id] = $(token_id)
    `, {
      token_id: userToken.token_id
    })
  }

  public async derivePassword (password: string): Promise<string> {
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

  public async insertUserToken (userToken: Partial<UserToken>): Promise<Pick<UserToken, 'token_id'>> {
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

    Object.defineProperty(user, 'token', {
      value: this.createUserToken(user, user.role?.expires ?? this.loginExpires)
    })

    if (user.token !== undefined) {
      await this.insertUserToken(user.token)
      response.setHeader('Set-Cookie', this.createCookie(user.token))
    }

    if (
      user.preferences.auth_login_email === true &&
      user.email !== null
    ) {
      await this.smtp?.send(await this.smtp.create('auth_login_email', {
        user
      }, user))
    }
  }

  public async logout (response: ServerResponse, user?: User): Promise<void> {
    if (user?.token !== undefined) {
      await this.store.del(`sc-auth-token-${user.token.hash}`)
      await this.deleteUserToken(user.token)
    }

    response.setHeader('Set-Cookie', this.createCookie())
  }

  public async requestFirstFactor (response: ServerResponse, user: User): Promise<Struct> {
    let type: string | null = null

    if (user.auth_password !== null) {
      type = 'password'
    } else if (
      user.auth_webauthn !== null &&
      user.auth_webauthn_confirmed === true
    ) {
      type = 'webauthn'
    }

    if (type === null) {
      response.statusCode = 401
      throw new Error('User has no credentials set')
    }

    const token = this.createUserToken(user, this.factorExpires)

    await this.storeFactor(token, {
      user_id: user.user_id
    })

    response.setHeader('Set-Cookie', this.createCookie(token))

    return {
      type
    }
  }

  public async requestSecondFactor (response: ServerResponse, user: User): Promise<Struct> {
    if (
      user.auth_totp !== null &&
      user.auth_totp_confirmed === true
    ) {
      return this.requestSecondFactorTotp(response, user)
    } else if (
      user.auth_hotp_email !== null &&
      user.auth_hotp_email_confirmed === true
    ) {
      return this.requestSecondFactorHotpEmail(response, user)
    } else if (
      user.auth_hotp_tel !== null &&
      user.auth_hotp_tel_confirmed === true
    ) {
      return this.requestSecondFactorHotpTel(response, user)
    }

    response.statusCode = 401
    throw new Error('MFA is undefined')
  }

  public async requestSecondFactorHotpEmail (response: ServerResponse, user: User): Promise<Struct> {
    const secret = new Secret()
    const counter = Math.round(Math.random() * 1_000_000)

    const otp = HOTP.generate({
      counter,
      secret
    })

    const token = this.createUserToken(user, this.factorExpires)

    await this.storeFactor(token, {
      auth_hotp: `${secret.base32}:${counter}`,
      user_id: user.user_id
    })

    await this.smtp?.send(await this.smtp.create('auth_hotp_email', {
      otp,
      token,
      user
    }, {
      email: user.auth_hotp_email,
      name: user.name,
      preferences: user.preferences,
      user_id: user.user_id
    }))

    response.setHeader('Set-Cookie', this.createCookie(token))

    return {
      email: user.auth_hotp_email,
      type: 'hotp'
    }
  }

  public async requestSecondFactorHotpTel (response: ServerResponse, user: User): Promise<Struct> {
    const secret = new Secret()
    const counter = Math.round(Math.random() * 1_000_000)

    const otp = HOTP.generate({
      counter,
      secret
    })

    const token = this.createUserToken(user, this.factorExpires)

    await this.storeFactor(token, {
      auth_hotp: `${secret.base32}:${counter}`,
      user_id: user.user_id
    })

    await this.sms?.send(await this.sms.create('auth_hotp_sms', {
      otp,
      token,
      user
    }, {
      name: user.name,
      preferences: user.preferences,
      tel: user.auth_hotp_tel,
      user_id: user.user_id
    }))

    response.setHeader('Set-Cookie', this.createCookie(token))

    return {
      tel: user.auth_hotp_tel,
      type: 'hotp'
    }
  }

  public async requestSecondFactorTotp (response: ServerResponse, user: User): Promise<Struct> {
    if (user.auth_totp === null) {
      response.statusCode = 401
      throw new Error('TOTP secret in database is null')
    }

    if (user.auth_totp_confirmed !== true) {
      response.statusCode = 401
      throw new Error('TOTP is not confirmed')
    }

    const token = this.createUserToken(user, this.factorExpires)

    await this.storeFactor(token, {
      user_id: user.user_id
    })

    response.setHeader('Set-Cookie', this.createCookie(token))

    return {
      type: 'totp'
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

  public async selectGroupFromStore (groupId: number): Promise<Group | undefined> {
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
      await this.storeGroup(group)
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

  public async selectRoleFromStore (roleId: number): Promise<Role | undefined> {
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
      await this.storeRole(role)
    }

    return role
  }

  public async selectUser (userId: number): Promise<User | undefined> {
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
      SELECT *
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
      await this.storeUser(user)
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
      await this.storeUserToken(userToken)
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

  public async storeFactor (token: UserToken, factor: Struct): Promise<void> {
    await this.store.set(`sc-auth-mfa-${token.hash}`, JSON.stringify(factor), {
      PX: this.factorExpires
    })
  }

  public async storeGroup (group: Group): Promise<void> {
    await this.store.set(`sc-auth-group-${group.group_id}`, JSON.stringify(group), {
      PX: this.entityExpires
    })
  }

  public async storeRole (role: Role): Promise<void> {
    await this.store.set(`sc-auth-role-${role.role_id}`, JSON.stringify(role), {
      PX: this.entityExpires
    })
  }

  public async storeUser (user: User): Promise<void> {
    await this.store.set(`sc-auth-user-${user.user_id}`, JSON.stringify(user), {
      PX: this.entityExpires
    })
  }

  public async storeUserToken (userToken: UserToken): Promise<void> {
    await this.store.set(`sc-auth-token-${userToken.hash}`, JSON.stringify(userToken), {
      PXAT: userToken.date_expires.valueOf()
    })
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

    const delta = HOTP.validate({
      ...this.hotp,
      counter: Number(counter),
      secret: Secret.fromBase32(secret),
      token: otp
    })

    return delta !== null
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
