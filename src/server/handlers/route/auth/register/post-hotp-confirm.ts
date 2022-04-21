import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'

interface AuthRegisterPostHotpConfirmData extends RouteData {
  body: {
    hotp: string
  }
}

export class AuthRegisterPostHotpConfirmHandler extends AuthHandler {
  public authenticate = true

  public method = 'POST'

  public schema = {
    body: {
      required: true,
      schema: {
        hotp: {
          pattern: /^\d{6}$/u,
          required: true,
          type: 'text'
        }
      },
      type: 'fieldset'
    }
  }

  public async handle (data: AuthRegisterPostHotpConfirmData, response: ServerResponse): Promise<void> {
    if (data.user === undefined) {
      response.statusCode = 401
      throw new Error('User is undefined')
    }

    const hash = this.auth.getHash(data)

    if (hash === undefined) {
      response.statusCode = 401
      throw new Error('Hash is undefined')
    }

    const tmpUser = await this.auth.getDelTmpUser(hash)

    if (tmpUser === null) {
      response.statusCode = 401
      throw new Error('User in store is null')
    }

    if (!this.auth.validateHotp(tmpUser, data.body.hotp)) {
      response.statusCode = 401
      throw new Error('HOTP is not valid')
    }

    await this.auth.login(response, data.user)
    await this.auth.updateUserHotp(tmpUser)
    await this.auth.clearBackoff(data)
  }
}
