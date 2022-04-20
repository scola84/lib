import { AuthHandler } from '../../../..'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'
import { createUser } from '../../../../entities'

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

export class AuthRegisterPostHandler extends AuthHandler {
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

  public async handle (data: AuthRegisterPostData, response: ServerResponse): Promise<void> {
    const existingUser = await this.auth.selectUserByIdentities(createUser({
      email: data.body.email,
      tel: data.body.tel,
      username: data.body.username
    }))

    if (existingUser !== undefined) {
      response.statusCode = 401
      throw new Error('User in database is defined')
    }

    const user = await this.auth.register(createUser({
      auth_password: await this.auth.createPassword(data.body.auth_password),
      email: data.body.email,
      name: data.body.name,
      preferences: data.body.preferences,
      tel: data.body.tel,
      username: data.body.username
    }))

    await this.auth.login(data, response, user)
    await this.auth.sendRegisterEmail(user)
    await this.auth.clearBackoff(data)
  }
}
