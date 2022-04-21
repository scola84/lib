import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'
import { createUser } from '../../../../entities'

export class AuthRegisterPostCodesRequestHandler extends AuthHandler {
  public authenticate = true

  public method = 'POST'

  public async handle (data: RouteData, response: ServerResponse): Promise<Struct> {
    if (data.user?.token === undefined) {
      response.statusCode = 401
      throw new Error('Token is undefined')
    }

    const codes = this.auth.createCodes()

    await this.auth.setTmpUser(createUser({
      auth_codes: codes,
      auth_codes_confirmed: true,
      user_id: data.user.user_id
    }), data.user.token)

    return {
      auth_codes: codes
    }
  }
}
