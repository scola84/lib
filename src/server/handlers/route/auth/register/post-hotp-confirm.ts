import { AuthHotp } from '../../../../helpers'
import { AuthRegisterHandler } from './abstract-register'
import type { Result } from '../../../../../common'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'

interface AuthRegisterPostHotpConfirmData extends RouteData {
  body: {
    token: string
  }
}

export class AuthRegisterPostHotpConfirmHandler extends AuthRegisterHandler {
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

  public async handle (data: AuthRegisterPostHotpConfirmData, response: ServerResponse): Promise<Result> {
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

    if (tmpUser.auth_hotp_email !== null) {
      return {
        code: 'ok_auth_register_hotp_email_confirm'
      }
    } else if (tmpUser.auth_hotp_tel_national !== null) {
      return {
        code: 'ok_auth_register_hotp_tel_confirm'
      }
    }

    response.statusCode = 401
    throw new Error('HOTP is undefined')
  }
}
