import { AuthPassword } from '../../../../helpers'
import { AuthRegisterPasswordHandler } from './abstract-password'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'
import { createUser } from '../../../../../common'

interface AuthRegisterPostData extends RouteData {
  body: {
    auth_password: string
    email?: string
    name?: string
    preferences: Struct
    tel_country_code?: string
    tel_national?: string
    username?: string
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

  public async handle (data: AuthRegisterPostData, response: ServerResponse): Promise<Struct> {
    const tmpUser = createUser({
      email: data.body.email,
      tel_country_code: data.body.tel_country_code,
      tel_national: data.body.tel_national,
      username: data.body.username
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
      email: data.body.email,
      name: data.body.name,
      preferences: data.body.preferences,
      tel_country_code: data.body.tel_country_code,
      tel_national: data.body.tel_national,
      username: data.body.username
    }))

    return {
      code: 'ok_auth_register'
    }
  }
}
