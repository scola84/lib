import { AuthHotp } from '../../../../helpers'
import { AuthLoginHandler } from './abstract-login'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'

interface AuthLoginPostHotpData extends RouteData {
  body: {
    token: string
  }
}

export class AuthLoginPostHotpHandler extends AuthLoginHandler {
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

  public async handle (data: AuthLoginPostHotpData, response: ServerResponse): Promise<void> {
    const user = await this.selectUser(data, response)
    const htop = AuthHotp.parse(user.auth_hotp ?? '')

    if (htop.validate(data.body) === null) {
      response.statusCode = 401
      throw new Error('HOTP is not valid')
    }

    await this.auth.login(response, user)
    await this.auth.clearBackoff(data)
    await this.sendMessage(user)
  }
}
