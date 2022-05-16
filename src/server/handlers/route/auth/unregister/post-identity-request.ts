import type { Result, User, UserToken } from '../../../../../common'
import type { RouteData, RouteHandlerOptions } from '../../../../helpers'
import { createUser, toString } from '../../../../../common'
import { AuthHandler } from '../auth'
import type { ServerResponse } from 'http'

export interface AuthUnregisterPostIdentityHandlerOptions extends Partial<RouteHandlerOptions
> {
  tokenExpires?: number
}

export class AuthUnregisterPostIdentityHandler extends AuthHandler {
  public method = 'POST'

  public tokenExpires: number

  public constructor (options?: AuthUnregisterPostIdentityHandlerOptions) {
    super(options)
    this.tokenExpires = options?.tokenExpires ?? 5 * 60 * 1000
  }

  public async handle (data: RouteData, response: ServerResponse): Promise<Result | undefined> {
    if (data.user === undefined) {
      response.statusCode = 401
      throw new Error('User is undefined')
    }

    const tmpUser = createUser({
      user_id: data.user.user_id
    })

    const token = this.auth.createUserToken(tmpUser, this.tokenExpires)

    await this.setTmpUser(tmpUser, token)

    if (data.user.email !== null) {
      return this.requestEmail(data.user, token)
    } else if (data.user.tel_national !== null) {
      return this.requestTel(data.user, token)
    }

    return undefined
  }

  protected async requestEmail (user: User, token: UserToken): Promise<Result> {
    this.smtp
      ?.send(await this.smtp.create('auth_unregister_identity', {
        date: new Date(),
        date_time_zone: user.preferences.time_zone,
        token: token,
        url: `${this.origin}?next=auth_unregister_identity_confirm&token=${token.hash}`,
        user: user
      }, {
        email: user.email,
        name: user.name,
        preferences: user.preferences
      }))
      .catch((error) => {
        this.logger?.error({
          context: 'request-email'
        }, toString(error))
      })

    return {
      code: 'ok_auth_unregister_identity_email_request',
      data: {
        email: user.email
          ?.slice(user.email.indexOf('@'))
          .padStart(user.email.length, '*')
      }
    }
  }

  protected async requestTel (user: User, token: UserToken): Promise<Result> {
    this.sms
      ?.send(await this.sms.create('auth_unregister_identity', {
        date: new Date(),
        date_time_zone: user.preferences.time_zone,
        token: token,
        url: `${this.origin}?next=auth_unregister_identity_confirm&token=${token.hash}`,
        user: user
      }, {
        preferences: user.preferences,
        tel: user.tel
      }))
      .catch((error) => {
        this.logger?.error({
          context: 'request-tel'
        }, toString(error))
      })

    return {
      code: 'ok_auth_unregister_identity_tel_request',
      data: {
        tel: user.tel
          .slice(-4)
          .padStart(user.tel.length, '*')
      }
    }
  }
}
