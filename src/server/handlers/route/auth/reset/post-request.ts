import type { Result, User } from '../../../../../common'
import type { RouteData, RouteHandlerOptions } from '../../../../helpers'
import { createUser, toString } from '../../../../../common'
import { AuthHandler } from '../auth'

interface AuthResetPostRequestData extends RouteData {
  body: {
    identity: string
  }
  user: User
}

export interface AuthResetPostRequestHandlerOptions extends Partial<RouteHandlerOptions> {
  tokenExpires?: number
}

export class AuthResetPostRequestHandler extends AuthHandler {
  public method = 'POST'

  public schema = {
    body: {
      required: true,
      schema: {
        identity: {
          required: true,
          type: 'text'
        }
      },
      type: 'fieldset'
    }
  }

  public tokenExpires: number

  public constructor (options?: AuthResetPostRequestHandlerOptions) {
    super(options)
    this.tokenExpires = options?.tokenExpires ?? 60 * 60 * 1000
  }

  public async handle (data: AuthResetPostRequestData): Promise<Result> {
    const user = await this.selectUserByIdentity(data.body.identity)

    if (user !== undefined) {
      data.user = user

      if (data.user.identity_email !== null) {
        return this.requestResetEmail(data)
      } else if (data.user.identity_tel_national !== null) {
        return this.requestResetTel(data)
      }
    }

    return {
      code: 'ok_reset_request'
    }
  }

  protected async requestResetEmail (data: AuthResetPostRequestData): Promise<Result> {
    const token = this.auth.createUserToken(data.user, this.tokenExpires)

    await this.setTmpUser(createUser({
      user_id: data.user.user_id
    }), token)

    this.smtp
      ?.send(await this.smtp.create('reset_request', {
        date: new Date(),
        date_time_zone: data.user.i18n_time_zone,
        token: {
          ...token,
          date_expires_time_zone: data.user.i18n_time_zone
        },
        url: `${this.origin}?next=auth_reset_confirm&data.date_expires=${token.date_expires.toISOString()}&data.hash=${token.hash}`,
        user: data.user
      }, {
        i18n_locale: data.user.i18n_locale,
        identity_email: data.user.identity_email,
        identity_name: data.user.identity_name
      }))
      .catch((error) => {
        this.logger?.error({
          context: 'reset-request-email'
        }, toString(error))
      })

    return {
      code: 'ok_reset_request'
    }
  }

  protected async requestResetTel (data: AuthResetPostRequestData): Promise<Result> {
    const token = this.auth.createUserToken(data.user, this.tokenExpires)

    await this.setTmpUser(createUser({
      user_id: data.user.user_id
    }), token)

    this.sms
      ?.send(await this.sms.create('reset_request', {
        date: new Date(),
        date_time_zone: data.user.i18n_time_zone,
        token: {
          date_expires_time_zone: data.user.i18n_time_zone,
          ...token
        },
        url: `${this.origin}?next=auth_reset_confirm&data.date_expires=${token.date_expires.toISOString()}&data.hash=${token.hash}`,
        user: data.user
      }, {
        i18n_locale: data.user.i18n_locale,
        identity_tel: data.user.identity_tel
      }))
      .catch((error) => {
        this.logger?.error({
          context: 'reset-request-tel'
        }, toString(error))
      })

    return {
      code: 'ok_reset_request'
    }
  }
}
