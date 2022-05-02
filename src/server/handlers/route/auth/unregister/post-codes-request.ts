import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'
import { createUser } from '../../../../../common'

export class AuthUnregisterPostCodesRequestHandler extends AuthHandler {
  public authenticate = true

  public method = 'POST'

  public async handle (data: RouteData, response: ServerResponse): Promise<Struct> {
    if (data.user?.token === undefined) {
      response.statusCode = 401
      throw new Error('Token is undefined')
    }

    await this.setTmpUser(createUser({
      auth_codes: null,
      auth_codes_confirmed: false,
      user_id: data.user.user_id
    }), data.user.token)

    return {
      code: 'ok_auth_unregister_codes_request'
    }
  }
}
