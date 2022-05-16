import { AuthHandler } from '../auth'
import { AuthTotp } from '../../../../helpers'
import type { Result } from '../../../../../common'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'

interface AuthUnregisterPostTotpConfirmData extends RouteData {
  body: {
    token: string
  }
}

export class AuthUnregisterPostTotpConfirmHandler extends AuthHandler {
  public authenticate = true

  public method = 'POST'

  public schema = {
    body: {
      required: true,
      schema: {
        token: {
          pattern: /^\d{6}$/u,
          required: true,
          type: 'text'
        }
      },
      type: 'fieldset'
    }
  }

  public async handle (data: AuthUnregisterPostTotpConfirmData, response: ServerResponse): Promise<Result> {
    if (data.user === undefined) {
      response.statusCode = 401
      throw new Error('User is undefined')
    }

    const tmpUser = await this.getTmpUser(data, response)
    const totp = AuthTotp.parse(tmpUser.auth_totp ?? '')

    if (totp.validate(data.body) === null) {
      response.statusCode = 401
      throw new Error('TOTP is not valid')
    }

    await this.updateUserTotp(tmpUser)
    return {
      code: 'ok_auth_unregister_totp_confirm'
    }
  }
}
