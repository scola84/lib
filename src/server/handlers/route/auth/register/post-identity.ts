import type { RouteData, RouteHandlerOptions } from '../../../../helpers'
import type { User, UserToken } from '../../../../entities'
import { AuthRegisterHandler } from './abstract-register'
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
    const user = await this.selectUserByIdentities(createUser({
      email: data.body.email,
      tel: data.body.tel,
      username: data.body.username
    }))

    if (user !== undefined) {
      response.statusCode = 401
      throw new Error('User in database is defined')
    }

    const tmpUser = createUser({
      email: data.body.email,
      name: data.body.name,
      preferences: data.body.preferences,
      tel: data.body.tel,
      username: data.body.username
    })

    const token = this.auth.createUserToken(tmpUser, this.tokenExpires)

    await this.setTmpUser(tmpUser, token)
    await this.sendMessage(tmpUser, token)
  }

  protected async sendMessage (user: User, token: UserToken): Promise<void> {
    if (user.email !== null) {
      await this.sendMessageEmail(user, token)
    } else if (user.tel !== null) {
      await this.sendMessageTel(user, token)
    }
  }

  protected async sendMessageEmail (user: User, token: UserToken): Promise<void> {
    await this.smtp?.send(await this.smtp.create('auth_register_identity_email', {
      token,
      user
    }, {
      email: user.email,
      name: user.name,
      preferences: user.preferences
    }))
  }

  protected async sendMessageTel (user: User, token: UserToken): Promise<void> {
    await this.sms?.send(await this.sms.create('auth_register_identity_tel', {
      token,
      user
    }, {
      preferences: user.preferences,
      tel: user.tel
    }))
  }
}
