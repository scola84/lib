import { AuthCodes } from '../../../../helpers'
import { AuthLoginHandler } from './abstract-login'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'

interface AuthLoginPostCodeData extends RouteData {
  body: {
    code: string
  }
}

export class AuthLoginPostCodeHandler extends AuthLoginHandler {
  public method = 'POST'

  public schema = {
    body: {
      required: true,
      schema: {
        code: {
          pattern: /^[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}$/u,
          required: true,
          type: 'text'
        }
      },
      type: 'fieldset'
    }
  }

  public async handle (data: AuthLoginPostCodeData, response: ServerResponse): Promise<void> {
    const user = await this.selectUser(data, response)
    const codes = AuthCodes.parse(user.auth_codes ?? '')

    if (!codes.validate(data.body.code)) {
      response.statusCode = 401
      throw new Error('Code is not valid')
    }

    user.auth_codes = codes.toString()
    await this.updateUserCodes(user)
    await this.auth.login(response, user)
    await this.auth.clearBackoff(data)
    await this.sendMessage(user)
  }
}
