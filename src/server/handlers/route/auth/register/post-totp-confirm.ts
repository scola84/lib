import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'

interface AuthRegisterPostTotpConfirmData extends RouteData {
  body: {
    totp: string
  }
}

export class AuthRegisterPostTotpConfirmHandler extends AuthHandler {
  public authenticate = true

  public method = 'POST'

  public schema = {
    body: {
      required: true,
      schema: {
        totp: {
          pattern: /^\d{6}$/u,
          required: true,
          type: 'text'
        }
      },
      type: 'fieldset'
    }
  }

  public async handle (data: AuthRegisterPostTotpConfirmData, response: ServerResponse): Promise<void> {
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

    if (!this.auth.validateTotp(tmpUser, data.body.totp)) {
      response.statusCode = 401
      throw new Error('TOTP is not valid')
    }

    await this.auth.updateUserTotp({
      auth_totp: tmpUser.auth_totp,
      user_id: tmpUser.user_id
    })

    await this.auth.login(data, response, data.user)
    await this.auth.clearBackoff(data)
  }
}
