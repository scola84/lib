import { AuthHotp, AuthPassword } from '../../../../helpers'
import type { RouteData, RouteHandlerOptions } from '../../../../helpers'
import { AuthLoginHandler } from './abstract-login'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'
import type { User } from '../../../../entities'
import { createUser } from '../../../../entities'

interface AuthLoginPasswordData extends RouteData {
  body: {
    password: string
  }
}

export interface AuthLoginPasswordHandlerOptions extends Partial<RouteHandlerOptions> {
  tokenExpires?: number
}

export abstract class AuthLoginPasswordHandler extends AuthLoginHandler {
  public tokenExpires: number

  public constructor (options?: AuthLoginPasswordHandlerOptions) {
    super(options)
    this.tokenExpires = options?.tokenExpires ?? 5 * 60 * 1000
  }

  protected async login (data: AuthLoginPasswordData, response: ServerResponse, user: User): Promise<Struct | undefined> {
    const password = AuthPassword.parse(user.auth_password ?? '')

    if (!(await password.validate(data.body.password))) {
      response.statusCode = 401
      throw new Error('Password is not valid')
    }

    if (
      user.role?.require_mfa === true ||
      user.auth_mfa === true
    ) {
      if (user.auth_totp !== null) {
        return this.requestTotp(response, user)
      }

      return this.requestHotp(response, user)
    }

    await this.auth.login(response, user)
    await this.auth.clearBackoff(data)
    await this.sendMessage(user)
    return undefined
  }

  protected async requestHotp (response: ServerResponse, user: User): Promise<Struct> {
    if (user.auth_hotp_email !== null) {
      return this.requestHotpEmail(response, user)
    } else if (user.auth_hotp_tel !== null) {
      return this.requestHotpTel(response, user)
    }

    response.statusCode = 401
    throw new Error('HOTP is undefined')
  }

  protected async requestHotpEmail (response: ServerResponse, user: User): Promise<Struct> {
    const hotp = new AuthHotp()
    const token = this.auth.createUserToken(user, this.tokenExpires)

    await this.setTmpUser(createUser({
      auth_hotp: hotp.toString(),
      user_id: user.user_id
    }), token)

    await this.smtp?.send(await this.smtp.create('auth_login_hotp_email', {
      token: hotp.generate(),
      user: user
    }, {
      email: user.auth_hotp_email,
      name: user.name,
      preferences: user.preferences
    }))

    response.setHeader('Set-Cookie', this.auth.createCookie(token))

    return {
      email: user.auth_hotp_email,
      type: 'hotp'
    }
  }

  protected async requestHotpTel (response: ServerResponse, user: User): Promise<Struct> {
    const hotp = new AuthHotp()
    const token = this.auth.createUserToken(user, this.tokenExpires)

    await this.setTmpUser(createUser({
      auth_hotp: hotp.toString(),
      user_id: user.user_id
    }), token)

    await this.sms?.send(await this.sms.create('auth_login_hotp_tel', {
      token: hotp.generate(),
      user: user
    }, {
      preferences: user.preferences,
      tel: user.auth_hotp_tel
    }))

    response.setHeader('Set-Cookie', this.auth.createCookie(token))

    return {
      tel: user.auth_hotp_tel,
      type: 'hotp'
    }
  }

  protected async requestTotp (response: ServerResponse, user: User): Promise<Struct> {
    const token = this.auth.createUserToken(user, this.tokenExpires)

    await this.setTmpUser(createUser({
      user_id: user.user_id
    }), token)

    response.setHeader('Set-Cookie', this.auth.createCookie(token))

    return {
      type: 'totp'
    }
  }
}
