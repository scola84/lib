import { AuthHandler } from '../auth'
import type { Result } from '../../../../../common'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import { createUser } from '../../../../../common'

export class AuthUnregisterPostTotpRequestHandler extends AuthHandler {
  public authenticate = true

  public method = 'POST'

  public async handle (data: RouteData, response: ServerResponse): Promise<Result> {
    if (data.user?.token === undefined) {
      response.statusCode = 403
      throw new Error('Token is undefined')
    }

    await this.setTmpUser(createUser({
      auth_totp: null,
      auth_totp_confirmed: false,
      user_id: data.user.user_id
    }), data.user.token)

    return {
      code: 'ok_unregister_totp_request'
    }
  }
}
