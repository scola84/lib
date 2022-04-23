import { AuthHandler } from '../auth'
import { AuthHotp } from '../../../../helpers'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'

interface AuthUnregisterPostHotpConfirmData extends RouteData {
  body: {
    token: string
  }
}

export class AuthUnregisterPostHotpConfirmHandler extends AuthHandler {
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

  public async handle (data: AuthUnregisterPostHotpConfirmData, response: ServerResponse): Promise<void> {
    if (data.user === undefined) {
      response.statusCode = 401
      throw new Error('User is undefined')
    }

    const tmpUser = await this.getTmpUser(data, response)
    const hotp = AuthHotp.parse(tmpUser.auth_hotp ?? '')

    if (hotp.validate(data.body) === null) {
      response.statusCode = 401
      throw new Error('HOTP is not valid')
    }

    await this.updateUserHotp(tmpUser)
  }
}
