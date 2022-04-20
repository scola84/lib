import { HOTP, Secret } from 'otpauth'
import type { RouteData, RouteHandlerOptions } from '../../../../helpers'
import { AuthHandler } from '../auth'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'
import type { User } from '../../../../entities'
import { createUser } from '../../../../entities'

interface AuthLoginPostPasswordData extends RouteData {
  body: {
    password: string
  }
}

export interface AuthLoginPostPasswordHandlerOptions extends Partial<RouteHandlerOptions> {
  tokenExpires?: number
}

export class AuthLoginPostPasswordHandler extends AuthHandler {
  public method = 'POST'

  public schema = {
    body: {
      required: true,
      schema: {
        password: {
          required: true,
          type: 'password'
        }
      },
      type: 'fieldset'
    }
  }

  public tokenExpires: number

  public constructor (options?: AuthLoginPostPasswordHandlerOptions) {
    super(options)
    this.tokenExpires = options?.tokenExpires ?? 5 * 60 * 1000
  }

  public async handle (data: AuthLoginPostPasswordData, response: ServerResponse): Promise<Struct | undefined> {
    const hash = this.auth.getHash(data)

    if (hash === undefined) {
      response.statusCode = 401
      throw new Error('Hash is undefined')
    }

    const tmpUser = await this.auth.getDelTmpUser(hash)

    if (tmpUser === null) {
      response.statusCode = 401
      throw new Error('User in store is null')
    }

    const user = await this.auth.selectUser(tmpUser.user_id)

    if (user === undefined) {
      response.statusCode = 401
      throw new Error('User in database is undefined')
    }

    if (user.auth_password === null) {
      response.statusCode = 401
      throw new Error('Password in database is null')
    }

    if (!(await this.auth.validatePassword(user, data.body.password))) {
      response.statusCode = 401
      throw new Error('Password is not valid')
    }

    if (
      user.role?.require_mfa === true ||
      user.auth_mfa === true
    ) {
      return this.requestSecondFactor(response, user)
    }

    await this.auth.login(data, response, user)
    await this.auth.sendLoginEmail(user)
    await this.auth.clearBackoff(data)
    return undefined
  }

  public async requestSecondFactor (response: ServerResponse, user: User): Promise<Struct> {
    if (user.auth_totp !== null) {
      return this.requestSecondFactorTotp(response, user)
    } else if (user.auth_hotp_email !== null) {
      return this.requestSecondFactorHotpEmail(response, user)
    } else if (user.auth_hotp_tel !== null) {
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

    const token = this.auth.createUserToken(user, this.tokenExpires)

    await this.auth.setTmpUser(createUser({
      auth_hotp: `${secret.base32}:${counter}`,
      user_id: user.user_id
    }), token)

    await this.smtp?.send(await this.smtp.create('auth_hotp_email', {
      otp,
      token,
      user
    }, user))

    response.setHeader('Set-Cookie', this.auth.createCookie(token))

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

    const token = this.auth.createUserToken(user, this.tokenExpires)

    await this.auth.setTmpUser(createUser({
      auth_hotp: `${secret.base32}:${counter}`,
      user_id: user.user_id
    }), token)

    await this.sms?.send(await this.sms.create('auth_hotp_sms', {
      otp,
      token,
      user
    }, user))

    response.setHeader('Set-Cookie', this.auth.createCookie(token))

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

    const token = this.auth.createUserToken(user, this.tokenExpires)

    await this.auth.setTmpUser(createUser({
      user_id: user.user_id
    }), token)

    response.setHeader('Set-Cookie', this.auth.createCookie(token))

    return {
      type: 'totp'
    }
  }
}
