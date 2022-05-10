import { AuthHotp, AuthPassword } from '../../../../helpers'
import type { RouteData, RouteHandlerOptions } from '../../../../helpers'
import type { Struct, User } from '../../../../../common'
import { createUser, toString } from '../../../../../common'
import { AuthLoginHandler } from './abstract-login'
import type { ServerResponse } from 'http'

interface AuthLoginPasswordData extends RouteData {
  body: {
    auth_password: string
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

    if (!(await password.validate(data.body.auth_password))) {
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

    Promise
      .resolve()
      .then(async () => {
        await this.auth.clearBackoff(data)
        await this.sendMessage(user)
      })
      .catch((error) => {
        this.logger?.error({
          context: 'login'
        }, toString(error))
      })

    return {
      code: 'ok_auth_login',
      next: 'auth_load'
    }
  }

  protected async requestHotp (response: ServerResponse, user: User): Promise<Struct> {
    if (user.auth_hotp_email !== null) {
      return this.requestHotpEmail(response, user)
    } else if (user.auth_hotp_tel_national !== null) {
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

    this.smtp
      ?.send(await this.smtp.create('auth_login_hotp', {
        date: new Date(),
        date_time_zone: user.preferences.time_zone,
        token: hotp.generate(),
        user: user
      }, {
        email: user.auth_hotp_email,
        name: user.name,
        preferences: user.preferences
      }))
      .catch((error) => {
        this.logger?.error({
          context: 'request-hotp-email'
        }, toString(error))
      })

    response.setHeader('Set-Cookie', this.auth.createCookie(token))
    return {
      code: 'ok_auth_login_hotp_email',
      data: {
        email: user.auth_hotp_email
          ?.slice(user.auth_hotp_email.indexOf('@'))
          .padStart(user.auth_hotp_email.length, '*')
      },
      next: 'auth_hotp'
    }
  }

  protected async requestHotpTel (response: ServerResponse, user: User): Promise<Struct> {
    const hotp = new AuthHotp()
    const token = this.auth.createUserToken(user, this.tokenExpires)

    await this.setTmpUser(createUser({
      auth_hotp: hotp.toString(),
      user_id: user.user_id
    }), token)

    this.sms
      ?.send(await this.sms.create('auth_login_hotp', {
        date: new Date(),
        date_time_zone: user.preferences.time_zone,
        token: hotp.generate(),
        user: user
      }, {
        preferences: user.preferences,
        tel: user.auth_hotp_tel
      }))
      .catch((error) => {
        this.logger?.error({
          context: 'request-hotp-tel'
        }, toString(error))
      })

    response.setHeader('Set-Cookie', this.auth.createCookie(token))
    return {
      code: 'ok_auth_login_hotp_tel',
      data: {
        tel: user.auth_hotp_tel
          .slice(-4)
          .padStart(user.auth_hotp_tel.length, '*')
      },
      next: 'auth_hotp'
    }
  }

  protected async requestTotp (response: ServerResponse, user: User): Promise<Struct> {
    const token = this.auth.createUserToken(user, this.tokenExpires)

    await this.setTmpUser(createUser({
      user_id: user.user_id
    }), token)

    response.setHeader('Set-Cookie', this.auth.createCookie(token))
    return {
      code: 'ok_auth_login_totp',
      next: 'auth_totp'
    }
  }
}
