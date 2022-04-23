import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import { createUser } from '../../../../entities'

export class AuthUnregisterPostTotpRequestHandler extends AuthHandler {
  public authenticate = true

  public method = 'POST'

  public async handle (data: RouteData, response: ServerResponse): Promise<void> {
    if (data.user?.token === undefined) {
      response.statusCode = 401
      throw new Error('Token is undefined')
    }

    await this.setTmpUser(createUser({
      auth_totp: null,
      auth_totp_confirmed: false,
      user_id: data.user.user_id
    }), data.user.token)
  }
}
