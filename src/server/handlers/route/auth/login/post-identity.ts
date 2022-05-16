import type { RouteData, RouteHandlerOptions } from '../../../../helpers'
import { AuthLoginHandler } from './abstract-login'
import type { Result } from '../../../../../common'
import type { ServerResponse } from 'http'
import { createUser } from '../../../../../common'

interface AuthLoginPostIdentityData extends RouteData {
  body: {
    identity: string
  }
}

export interface AuthLoginPostIdentityHandlerOptions extends Partial<RouteHandlerOptions> {
  tokenExpires?: number
}

export class AuthLoginPostIdentityHandler extends AuthLoginHandler {
  public method = 'POST'

  public schema = {
    body: {
      required: true,
      schema: {
        identity: {
          required: true,
          type: 'text'
        }
      },
      type: 'fieldset'
    }
  }

  public tokenExpires: number

  public constructor (options?: AuthLoginPostIdentityHandlerOptions) {
    super(options)
    this.tokenExpires = options?.tokenExpires ?? 5 * 60 * 1000
  }

  public async handle (data: AuthLoginPostIdentityData, response: ServerResponse): Promise<Result> {
    const user = await this.selectUserByIdentity(data.body.identity)

    if (user === undefined) {
      response.statusCode = 401
      throw new Error('User in database is undefined')
    }

    let type: string | null = null

    if (user.auth_password !== null) {
      type = 'auth_password'
    } else if (user.auth_webauthn !== null) {
      type = 'auth_webauthn'
    }

    if (type === null) {
      response.statusCode = 401
      throw new Error('User has no credentials set')
    }

    const token = this.auth.createUserToken(user, this.tokenExpires)

    await this.setTmpUser(createUser({
      user_id: user.user_id
    }), token)

    response.setHeader('Set-Cookie', this.auth.createCookie(token))
    return {
      code: 'ok_auth_login_identity',
      type: type
    }
  }
}
