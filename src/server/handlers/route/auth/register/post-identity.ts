import type { RouteData, RouteHandlerOptions } from '../../../../helpers'
import type { Struct, User, UserToken } from '../../../../../common'
import { createUser, toString } from '../../../../../common'
import { AuthRegisterHandler } from './abstract-register'
import type { ServerResponse } from 'http'

interface AuthRegisterPostIdentityData extends RouteData {
  body: {
    email?: string
    name?: string
    preferences: Struct
    tel_country_code?: string
    tel_national?: string
    username?: string
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
        email: {
          type: 'email'
        },
        name: {
          type: 'text'
        },
        preferences: {
          required: true,
          schema: {
            locale: {
              generator: 'sc-locale',
              required: true,
              type: 'select'
            },
            time_zone: {
              generator: 'sc-time-zone',
              required: true,
              type: 'select'
            }
          },
          type: 'fieldset'
        },
        tel_country_code: {
          generator: 'sc-tel-country-code',
          type: 'select'
        },
        tel_national: {
          custom: 'tel-national',
          type: 'tel'
        },
        username: {
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

  public async handle (data: AuthRegisterPostIdentityData, response: ServerResponse): Promise<Struct | undefined> {
    const tmpUser = createUser({
      email: data.body.email,
      name: data.body.name,
      preferences: data.body.preferences,
      tel_country_code: data.body.tel_country_code,
      tel_national: data.body.tel_national,
      username: data.body.username
    })

    const user = await this.selectUserByIdentities(tmpUser)

    if (user !== undefined) {
      response.statusCode = 401
      throw new Error('User in database is defined')
    }

    const token = this.auth.createUserToken(tmpUser, this.tokenExpires)

    await this.setTmpUser(tmpUser, token)

    if (tmpUser.email !== null) {
      return this.requestEmail(tmpUser, token)
    } else if (tmpUser.tel_national !== null) {
      return this.requestTel(tmpUser, token)
    }

    return undefined
  }

  protected async requestEmail (user: User, token: UserToken): Promise<Struct> {
    this.smtp
      ?.send(await this.smtp.create('auth_register_identity', {
        date: new Date(),
        date_time_zone: user.preferences.time_zone,
        token: token,
        url: `${this.origin}?next=auth_register_identity_password&token=${token.hash}`,
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
      code: 'ok_auth_register_identity_email',
      data: {
        email: user.email
          ?.slice(user.email.indexOf('@'))
          .padStart(user.email.length, '*')
      }
    }
  }

  protected async requestTel (user: User, token: UserToken): Promise<Struct> {
    this.sms
      ?.send(await this.sms.create('auth_register_identity', {
        date: new Date(),
        date_time_zone: user.preferences.time_zone,
        token: token,
        url: `${this.origin}?next=auth_register_identity_password&token=${token.hash}`,
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
      code: 'ok_auth_register_identity_tel',
      data: {
        tel: user.tel
          .slice(-4)
          .padStart(user.tel.length, '*')
      }
    }
  }
}
