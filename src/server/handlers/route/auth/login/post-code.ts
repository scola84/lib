import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { User } from '../../../../entities'

interface AuthLoginPostCodeData extends RouteData {
  body: {
    code: string
  }
}

export class AuthLoginCodeHandler extends AuthHandler {
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
      type: 'struct'
    }
  }

  public async handle (data: AuthLoginPostCodeData, response: ServerResponse): Promise<void> {
    const hash = this.auth.extractTokenHash(data)

    if (hash === undefined) {
      response.statusCode = 401
      throw new Error('Hash is undefined')
    }

    const storedUser = await this.store.getDel(`sc-auth-mfa-${hash}`)

    if (storedUser === null) {
      response.statusCode = 401
      throw new Error('Stored user is null')
    }

    const parsedUser = JSON.parse(storedUser) as User
    const user = await this.auth.selectUser(parsedUser.user_id)

    if (user === undefined) {
      response.statusCode = 401
      throw new Error('User is undefined')
    }

    if (!user.active) {
      response.statusCode = 401
      throw new Error('User is not active')
    }

    if (user.codes === null) {
      response.statusCode = 401
      throw new Error('Codes is null')
    }

    if (!this.auth.validateCode(user, data.body.code)) {
      response.statusCode = 401
      throw new Error('Code is not valid')
    }

    await this.auth.updateUserCodes(user)
    await this.auth.login(response, user)
    await this.auth.clearBackoff(data)

    if (user.email_prefs?.after_login === true) {
      await this.sendEmail(user, 'auth_login_email', {
        user
      })
    }
  }
}
