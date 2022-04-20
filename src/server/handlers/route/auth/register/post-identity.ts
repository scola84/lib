import type { RouteData, RouteHandlerOptions } from '../../../../helpers'
import { AuthHandler } from '../auth'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'
import { createUser } from '../../../../entities'

interface AuthRegisterPostIdentityData extends RouteData {
  body: {
    email?: string
    name?: string
    preferences: Struct
    tel?: string
    username?: string
  }
}

export interface AuthRegisterPostIdentityHandlerOptions extends Partial<RouteHandlerOptions> {
  tokenExpires?: number
}

export class AuthRegisterPostIdentityHandler extends AuthHandler {
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

  public tokenExpires: number

  public constructor (options?: AuthRegisterPostIdentityHandlerOptions) {
    super(options)
    this.tokenExpires = options?.tokenExpires ?? 5 * 60 * 1000
  }

  public async handle (data: AuthRegisterPostIdentityData, response: ServerResponse): Promise<void> {
    const existingUser = await this.auth.selectUserByIdentities(createUser({
      email: data.body.email,
      tel: data.body.tel,
      username: data.body.username
    }))

    if (existingUser !== undefined) {
      response.statusCode = 401
      throw new Error('User in database is defined')
    }

    const user = createUser({
      email: data.body.email,
      name: data.body.name,
      preferences: data.body.preferences,
      tel: data.body.tel,
      username: data.body.username
    })

    const token = this.auth.createUserToken(user, this.tokenExpires)

    await this.auth.setTmpUser(user, token)

    if (user.email !== null) {
      await this.smtp?.send(await this.smtp.create('auth_register_identity_email', {
        token,
        user
      }, user))
    } else if (user.tel !== null) {
      await this.sms?.send(await this.sms.create('auth_register_identity_sms', {
        token,
        user
      }, user))
    }
  }
}
