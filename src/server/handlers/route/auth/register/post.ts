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
    tel?: string
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
              pattern: /^[a-z]{2}-[a-z]{2}$/ui,
              required: true,
              type: 'text'
            }
          },
          type: 'fieldset'
        },
        tel: {
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
      tel: data.body.tel,
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
      tel: data.body.tel,
      username: data.body.username
    }))

    return {
      code: 'ok_auth_register'
    }
  }
}
