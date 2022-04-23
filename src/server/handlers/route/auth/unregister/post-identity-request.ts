import type { RouteData, RouteHandlerOptions } from '../../../../helpers'
import type { User, UserToken } from '../../../../entities'
import { AuthHandler } from '../auth'
import type { ServerResponse } from 'http'
import { createUser } from '../../../../entities'

export interface AuthUnregisterPostIdentityHandlerOptions extends Partial<RouteHandlerOptions
> {
  tokenExpires?: number
}

export class AuthUnregisterPostIdentityHandler extends AuthHandler {
  public method = 'POST'

  public tokenExpires: number

  public constructor (options?: AuthUnregisterPostIdentityHandlerOptions) {
    super(options)
    this.tokenExpires = options?.tokenExpires ?? 5 * 60 * 1000
  }

  public async handle (data: RouteData, response: ServerResponse): Promise<void> {
    if (data.user === undefined) {
      response.statusCode = 401
      throw new Error('User is undefined')
    }

    const tmpUser = createUser({
      user_id: data.user.user_id
    })

    const token = this.auth.createUserToken(tmpUser, this.tokenExpires)

    await this.setTmpUser(tmpUser, token)
    await this.sendMessage(data.user, token)
  }

  protected async sendMessage (user: User, token: UserToken): Promise<void> {
    if (user.email !== null) {
      await this.sendMessageEmail(user, token)
    } else if (user.tel !== null) {
      await this.sendMessageTel(user, token)
    }
  }

  protected async sendMessageEmail (user: User, token: UserToken): Promise<void> {
    await this.smtp?.send(await this.smtp.create('auth_unregister_identity_email', {
      token,
      user
    }, {
      email: user.email,
      name: user.name,
      preferences: user.preferences
    }))
  }

  protected async sendMessageTel (user: User, token: UserToken): Promise<void> {
    await this.sms?.send(await this.sms.create('auth_unregister_identity_tel', {
      token,
      user
    }, {
      preferences: user.preferences,
      tel: user.tel
    }))
  }
}
