import { AuthLoginHandler } from './abstract-login'
import { AuthTotp } from '../../../../helpers'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'

interface AuthLoginPostTotpData extends RouteData {
  body: {
    token: string
  }
}

export class AuthLoginPostTotpHandler extends AuthLoginHandler {
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

  public async handle (data: AuthLoginPostTotpData, response: ServerResponse): Promise<Struct> {
    const user = await this.selectUser(data, response)
    const totp = AuthTotp.parse(user.auth_totp ?? '')

    if (totp.validate(data.body) === null) {
      response.statusCode = 401
      throw new Error('TOTP is not valid')
    }

    await this.auth.login(response, user)
    await this.auth.clearBackoff(data)
    await this.sendMessage(user)
    return {
      code: 'ok_auth_login'
    }
  }
}
