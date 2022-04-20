import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'

export class AuthRegisterPostTotpRequestHandler extends AuthHandler {
  public authenticate = true

  public method = 'POST'

  public async handle (data: RouteData, response: ServerResponse): Promise<Struct | undefined> {
    if (data.user === undefined) {
      response.statusCode = 401
      throw new Error('User is undefined')
    }

    const totp = this.auth.createTotp()
    const token = await this.auth.login(data, response, data.user)

    const user = {
      ...data.user,
      auth_totp: totp.secret.base32
    }

    await this.auth.setTmpUser(user, token)

    return {
      secret: totp.secret.base32,
      url: totp.toString()
    }
  }
}
