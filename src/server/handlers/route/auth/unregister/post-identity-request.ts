import type { RouteData, RouteHandlerOptions } from '../../../../helpers'
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

    const user = createUser({
      user_id: data.user.user_id
    })

    const token = this.auth.createUserToken(user, this.tokenExpires)

    await this.auth.setTmpUser(user, token)

    if (data.user.email !== null) {
      await this.smtp?.send(await this.smtp.create('auth_unregister_identity_email', {
        token: token,
        user: data.user
      }, data.user))
    } else if (data.user.tel !== null) {
      await this.sms?.send(await this.sms.create('auth_unregister_identity_sms', {
        token: token,
        user: data.user
      }, data.user))
    }
  }
}
