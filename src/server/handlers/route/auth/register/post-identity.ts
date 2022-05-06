import type { RouteData, RouteHandlerOptions } from '../../../../helpers'
import type { Struct, User, UserToken } from '../../../../../common'
import { AuthRegisterHandler } from './abstract-register'
import type { ServerResponse } from 'http'
import { createUser } from '../../../../../common'

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

  public async handle (data: AuthRegisterPostIdentityData, response: ServerResponse): Promise<Struct | undefined> {
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

    if (tmpUser.email !== null) {
      return this.requestEmail(tmpUser, token)
    } else if (tmpUser.tel !== null) {
      return this.requestTel(tmpUser, token)
    }

    return undefined
  }

  protected async requestEmail (user: User, token: UserToken): Promise<Struct> {
    await this.smtp?.send(await this.smtp.create('auth_register_identity', {
      date: new Date(),
      date_tz: user.preferences.time_zone,
      token: token,
      url: `${this.origin}?next=auth_register_identity_password&token=${token.hash}`,
      user: user
    }, {
      email: user.email,
      name: user.name,
      preferences: user.preferences
    }))

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
    await this.sms?.send(await this.sms.create('auth_register_identity', {
      date: new Date(),
      date_tz: user.preferences.time_zone,
      token: token,
      url: `${this.origin}?next=auth_register_identity_password&token=${token.hash}`,
      user: user
    }, {
      preferences: user.preferences,
      tel: user.tel
    }))

    return {
      code: 'ok_auth_register_identity_tel',
      data: {
        tel: user.tel
          ?.slice(-4)
          .padStart(user.tel.length, '*')
      }
    }
  }
}
