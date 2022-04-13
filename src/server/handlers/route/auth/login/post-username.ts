import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'

interface AuthLoginPostUsernameData extends RouteData {
  body: {
    username: string
  }
}

export class AuthLoginPostUsernameHandler extends AuthHandler {
  public schema = {
    body: {
      required: true,
      schema: {
        username: {
          required: true,
          type: 'text'
        }
      },
      type: 'struct'
    }
  }

  public async handle (data: AuthLoginPostUsernameData, response: ServerResponse): Promise<Struct | undefined> {
    const user = await this.auth.selectUserByUsername(data.body.username)

    if (user === undefined) {
      response.statusCode = 401
      throw new Error('User is undefined')
    }

    let type: string | null = null

    if (user.auth_password !== null) {
      type = 'password'
    } else if (
      user.auth_webauthn !== null &&
      user.auth_webauthn_confirmed
    ) {
      type = 'webauthn'
    }

    if (type === null) {
      response.statusCode = 401
      throw new Error('Type is null')
    }

    const token = this.auth.createUserToken(user, this.px)

    await this.store.set(`sc-auth-mfa-${token.hash}`, JSON.stringify({
      user_id: user.user_id
    }), {
      PX: this.px
    })

    response.setHeader('Set-Cookie', this.auth.createCookie(token))
    return { type }
  }
}
