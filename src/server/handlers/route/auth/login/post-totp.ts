import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { User } from '../../../../entities'

interface AuthLoginPostTotpData extends RouteData {
  body: {
    totp: string
  }
}

export class AuthLoginPostTotpHandler extends AuthHandler {
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

  public async handle (data: AuthLoginPostTotpData, response: ServerResponse): Promise<void> {
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

    if (user.auth_totp === null) {
      response.statusCode = 401
      throw new Error('TOTP secret in database is null')
    }

    if (!this.auth.validateTotp(user, data.body.totp)) {
      response.statusCode = 401
      throw new Error('TOTP is not valid')
    }

    await this.auth.login(response, user)
    await this.auth.clearBackoff(data)
  }
}
