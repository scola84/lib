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

    return this.login(data, response, user)
  }

  protected async login (data: AuthLoginPostPasswordData, response: ServerResponse, user: User): Promise<Struct | undefined> {
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
      if (user.auth_totp !== null) {
        return this.requestTotp(response, user)
      }

      return this.requestHotp(response, user)
    }

    await this.auth.login(response, user)

    if (
      user.preferences.auth_login_email === true &&
      user.email !== null
    ) {
      await this.smtp?.send(await this.smtp.create('auth_login_email', {
        user
      }, user))
    }

    await this.auth.clearBackoff(data)
    return undefined
  }

  protected async requestHotp (response: ServerResponse, user: User): Promise<Struct> {
    const hotp = this.auth.createHotp()
    const token = this.auth.createUserToken(user, this.tokenExpires)

    await this.auth.setTmpUser(createUser({
      auth_hotp: `${hotp.secret.base32}:${hotp.counter}`,
      user_id: user.user_id
    }), token)

    if (user.auth_hotp_email !== null) {
      await this.smtp?.send(await this.smtp.create('auth_login_hotp_email', {
        hotp: hotp.generate(),
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
    } else if (user.auth_hotp_tel !== null) {
      await this.sms?.send(await this.sms.create('auth_login_hotp_sms', {
        hotp: hotp.generate(),
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

    response.statusCode = 401
    throw new Error('MFA is undefined')
  }

  protected async requestTotp (response: ServerResponse, user: User): Promise<Struct> {
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
