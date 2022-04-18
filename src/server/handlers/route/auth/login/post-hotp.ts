import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { User } from '../../../../entities'
import { isNil } from '../../../../../common'

interface AuthLoginPostHotpData extends RouteData {
  body: {
    hotp: string
  }
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

  public async handle (data: AuthLoginPostHotpData, response: ServerResponse): Promise<void> {
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

    if (isNil(parsedUser.auth_hotp)) {
      response.statusCode = 401
      throw new Error('HOTP secret in database is null')
    }

    if (!this.auth.validateHotp(parsedUser, data.body.hotp)) {
      response.statusCode = 401
      throw new Error('HOTP is not valid')
    }

    await this.auth.login(response, user)
    await this.auth.clearBackoff(data)
  }
}
