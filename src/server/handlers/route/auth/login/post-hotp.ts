import type { RouteData, RouteHandlerOptions } from '../../../../helpers'
import { AuthHandler } from '../auth'
import type { ServerResponse } from 'http'
import { isNil } from '../../../../../common'

interface AuthLoginPostHotpData extends RouteData {
  body: {
    hotp: string
  }
}

export interface AuthLoginPostHotpHandlerOptions extends Partial<RouteHandlerOptions> {
}

export class AuthLoginPostHotpHandler extends AuthHandler {
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

  public constructor (options?: AuthLoginPostHotpHandlerOptions) {
    super(options)
  }

  public async handle (data: AuthLoginPostHotpData, response: ServerResponse): Promise<void> {
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

    const user = await this.auth.selectUser(tmpUser.user_id)

    if (user === undefined) {
      response.statusCode = 401
      throw new Error('User in database is undefined')
    }

    if (isNil(tmpUser.auth_hotp)) {
      response.statusCode = 401
      throw new Error('HOTP secret in database is null')
    }

    if (!this.auth.validateHotp(tmpUser, data.body.hotp)) {
      response.statusCode = 401
      throw new Error('HOTP is not valid')
    }

    await this.auth.login(data, response, user)
    await this.auth.sendLoginEmail(user)
    await this.auth.clearBackoff(data)
  }
}
