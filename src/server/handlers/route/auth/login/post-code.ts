import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { User } from '../../../../entities'

interface AuthLoginPostCodeData extends RouteData {
  body: {
    code: string
  }
}

export class AuthLoginPostCodeHandler extends AuthHandler {
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
    const hash = this.auth.extractTokenHash(data)

    if (hash === undefined) {
      response.statusCode = 401
      throw new Error('Hash in request headers is undefined')
    }

    const storedUser = await this.store.getDel(`sc-auth-mfa-${hash}`)

    if (storedUser === null) {
      response.statusCode = 401
      throw new Error('User in store is null')
    }

    const parsedUser = JSON.parse(storedUser) as User
    const user = await this.auth.selectUser(parsedUser.user_id)

    if (user === undefined) {
      response.statusCode = 401
      throw new Error('User in database is undefined')
    }

    if (user.auth_codes === null) {
      response.statusCode = 401
      throw new Error('Codes in database is null')
    }

    if (!this.auth.validateCode(user, data.body.code)) {
      response.statusCode = 401
      throw new Error('Code is not valid')
    }

    await this.auth.updateUserCodes(user)
    await this.auth.login(response, user)
    await this.auth.clearBackoff(data)

    if (user.preferences.auth_login_email === true) {
      await this.sendEmail(user, 'auth_login_email', {
        user
      })
    }
  }
}
