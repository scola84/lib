import type { RouteData, RouteHandlerOptions } from '../../../../helpers'
import { AuthHandler } from '../auth'
import type { ServerResponse } from 'http'

interface AuthLoginPostTotpData extends RouteData {
  body: {
    totp: string
  }
}

export interface AuthLoginPostTotpHandlerOptions extends Partial<RouteHandlerOptions> {
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

  public constructor (options?: AuthLoginPostTotpHandlerOptions) {
    super(options)
  }

  public async handle (data: AuthLoginPostTotpData, response: ServerResponse): Promise<void> {
    const hash = this.auth.getHash(data)

    if (hash === undefined) {
      response.statusCode = 401
      throw new Error('Hash is undefined')
    }

    const tmpUser = await this.auth.getDelTmpUser(hash)

    if (tmpUser === null) {
      response.statusCode = 401
      throw new Error('Factor in store is null')
    }

    const user = await this.auth.selectUser(tmpUser.user_id)

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

    await this.auth.login(data, response, user)
    await this.auth.sendLoginEmail(user)
    await this.auth.clearBackoff(data)
  }
}
