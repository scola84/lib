import { AuthPassword } from '../../../../helpers'
import { AuthRegisterPasswordHandler } from './abstract-password'
import type { Result } from '../../../../../common'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import { createUser } from '../../../../../common'

interface AuthRegisterPostData extends RouteData {
  body: {
    auth_password: string
    i18n_locale?: string
    i18n_time_zone?: string
    identity_email?: string
    identity_name?: string
    identity_tel_country_code?: string
    identity_tel_national?: string
    identity_username?: string
  }
}

export class AuthRegisterPostHandler extends AuthRegisterPasswordHandler {
  public method = 'POST'

  public schema = {
    body: {
      custom: 'identity',
      required: true,
      schema: {
        auth_password: {
          required: true,
          type: 'password'
        },
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

  public async handle (data: AuthRegisterPostData, response: ServerResponse): Promise<Result> {
    const tmpUser = createUser({
      identity_email: data.body.identity_email,
      identity_tel_country_code: data.body.identity_tel_country_code,
      identity_tel_national: data.body.identity_tel_national,
      identity_username: data.body.identity_username
    })

    const user = await this.selectUserByIdentities(tmpUser)

    if (user !== undefined) {
      response.statusCode = 401
      throw new Error('User in database is defined')
    }

    const password = new AuthPassword()

    await password.generate(data.body.auth_password)

    await this.register(data, response, createUser({
      auth_password: password.toString(),
      email_auth_login: true,
      email_auth_update: true,
      i18n_locale: data.body.i18n_locale,
      i18n_time_zone: data.body.i18n_time_zone,
      identity_email: data.body.identity_email,
      identity_name: data.body.identity_name,
      identity_tel_country_code: data.body.identity_tel_country_code,
      identity_tel_national: data.body.identity_tel_national,
      identity_username: data.body.identity_username
    }))

    return {
      code: 'ok_register'
    }
  }
}
