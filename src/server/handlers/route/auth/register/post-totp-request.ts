import { AuthRegisterHandler } from './abstract-register'
import { AuthTotp } from '../../../../helpers'
import type { Result } from '../../../../../common'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import { createUser } from '../../../../../common'

export class AuthRegisterPostTotpRequestHandler extends AuthRegisterHandler {
  public authenticate = true

  public method = 'POST'

  public async handle (data: RouteData, response: ServerResponse): Promise<Result> {
    if (data.user?.token === undefined) {
      response.statusCode = 401
      throw new Error('Token is undefined')
    }

    const totp = new AuthTotp()

    await this.setTmpUser(createUser({
      auth_totp: totp.toString(),
      auth_totp_confirmed: true,
      user_id: data.user.user_id
    }), data.user.token)

    return {
      code: 'ok_auth_register_totp_request',
      data: {
        secret: totp.secret.base32,
        url: totp.toString()
      }
    }
  }
}
