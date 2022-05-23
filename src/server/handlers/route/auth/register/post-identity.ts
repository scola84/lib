import type { Result, User, UserToken } from '../../../../../common'
import type { RouteData, RouteHandlerOptions } from '../../../../helpers'
import { createUser, toString } from '../../../../../common'
import { AuthRegisterHandler } from './abstract-register'
import type { ServerResponse } from 'http'

interface AuthRegisterPostIdentityData extends RouteData {
  body: {
    i18n_locale?: string
    i18n_time_zone?: string
    identity_email?: string
    identity_name?: string
    identity_tel_country_code?: string
    identity_tel_national?: string
    identity_username?: string
  }
}

export interface AuthRegisterPostIdentityHandlerOptions extends Partial<RouteHandlerOptions> {
  tokenExpires?: number
}

export class AuthRegisterPostIdentityHandler extends AuthRegisterHandler {
  public method = 'POST'

  public schema = {
    body: {
      custom: 'identity',
      required: true,
      schema: {
        i18n_locale: {
          generator: 'sc-locale',
          required: true,
          type: 'select'
        },
        i18n_time_zone: {
          generator: 'sc-time-zone',
          required: true,
          type: 'select'
        },
        identity_email: {
          type: 'email'
        },
        identity_name: {
          type: 'text'
        },
        identity_tel_country_code: {
          generator: 'sc-tel-country-code',
          type: 'select'
        },
        identity_tel_national: {
          custom: 'tel-national',
          type: 'tel'
        },
        identity_username: {
          type: 'text'
        }
      },
      type: 'fieldset'
    }
  }

  public tokenExpires: number

  public constructor (options?: AuthRegisterPostIdentityHandlerOptions) {
    super(options)
    this.tokenExpires = options?.tokenExpires ?? 5 * 60 * 1000
  }

  public async handle (data: AuthRegisterPostIdentityData, response: ServerResponse): Promise<Result | undefined> {
    const tmpUser = createUser({
      email_auth_login: true,
      email_auth_update: true,
      i18n_locale: data.body.i18n_locale,
      i18n_time_zone: data.body.i18n_time_zone,
      identity_email: data.body.identity_email,
      identity_name: data.body.identity_name,
      identity_tel_country_code: data.body.identity_tel_country_code,
      identity_tel_national: data.body.identity_tel_national,
      identity_username: data.body.identity_username
    })

    const user = await this.selectUserByIdentities(tmpUser)

    if (user !== undefined) {
      response.statusCode = 403
      throw new Error('User in database is defined')
    }

    const token = this.auth.createUserToken(tmpUser, this.tokenExpires)

    await this.setTmpUser(tmpUser, token)

    if (tmpUser.identity_email !== null) {
      return this.requestEmail(tmpUser, token)
    } else if (tmpUser.identity_tel_national !== null) {
      return this.requestTel(tmpUser, token)
    }

    return undefined
  }

  protected async requestEmail (user: User, token: UserToken): Promise<Result> {
    this.smtp
      ?.send(await this.smtp.create('register_identity', {
        date: new Date(),
        date_time_zone: user.i18n_time_zone,
        token: {
          date_expires_time_zone: user.i18n_time_zone,
          ...token
        },
        url: `${this.origin}?next=auth_register_password&data.date_expires=${token.date_expires.toISOString()}&data.hash=${token.hash}`,
        user: user
      }, {
        i18n_locale: user.i18n_locale,
        identity_email: user.identity_email,
        identity_name: user.identity_name
      }))
      .catch((error) => {
        this.logger?.error({
          context: 'request-email'
        }, toString(error))
      })

    return {
      code: 'ok_register_identity_email',
      data: {
        email: user.identity_email
          ?.slice(user.identity_email.indexOf('@'))
          .padStart(user.identity_email.length, '*')
      }
    }
  }

  protected async requestTel (user: User, token: UserToken): Promise<Result> {
    this.sms
      ?.send(await this.sms.create('register_identity', {
        date: new Date(),
        date_time_zone: user.i18n_time_zone,
        token: {
          date_expires_time_zone: user.i18n_time_zone,
          ...token
        },
        url: `${this.origin}?next=auth_register_password&data.date_expires=${token.date_expires.toISOString()}&data.hash=${token.hash}`,
        user: user
      }, {
        i18n_locale: user.i18n_locale,
        identity_tel: user.identity_tel
      }))
      .catch((error) => {
        this.logger?.error({
          context: 'request-tel'
        }, toString(error))
      })

    return {
      code: 'ok_register_identity_tel',
      data: {
        tel: user.identity_tel
          .slice(-4)
          .padStart(user.identity_tel.length, '*')
      }
    }
  }
}
