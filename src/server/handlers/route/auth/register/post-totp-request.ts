import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'
import { createUser } from '../../../../entities'

export class AuthRegisterPostTotpRequestHandler extends AuthHandler {
  public authenticate = true

  public method = 'POST'

  public async handle (data: RouteData, response: ServerResponse): Promise<Struct> {
    if (data.user?.token === undefined) {
      response.statusCode = 401
      throw new Error('Token is undefined')
    }

    const totp = this.auth.createTotp()

    await this.auth.setTmpUser(createUser({
      auth_totp: totp.secret.base32,
      auth_totp_confirmed: true,
      user_id: data.user.user_id
    }), data.user.token)

    return {
      secret: totp.secret.base32,
      url: totp.toString()
    }
  }
}
