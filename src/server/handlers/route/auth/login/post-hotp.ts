import { AuthHotp } from '../../../../helpers'
import { AuthLoginHandler } from './abstract-login'
import type { Result } from '../../../../../common'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import { toString } from '../../../../../common'

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

  public async handle (data: AuthLoginPostHotpData, response: ServerResponse): Promise<Result> {
    const user = await this.selectTmpUser(data, response)
    const htop = AuthHotp.parse(user.auth_hotp ?? '')

    if (htop.validate(data.body) === null) {
      response.statusCode = 403
      throw new Error('HOTP is not valid')
    }

    await this.auth.login(response, user)

    Promise
      .resolve()
      .then(async () => {
        await this.auth.clearBackoff(data)
        await this.sendMessage(user)
      })
      .catch((error) => {
        this.logger?.error({
          context: 'handle'
        }, toString(error))
      })

    return {
      code: 'ok_login'
    }
  }
}
