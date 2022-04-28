import { AuthLoginPasswordHandler } from './abstract-password'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'

interface AuthLoginPostData extends RouteData {
  body: {
    auth_password: string
    identity: string
  }
}

export class AuthLoginPostHandler extends AuthLoginPasswordHandler {
  public method = 'POST'

  public schema = {
    body: {
      required: true,
      schema: {
        auth_password: {
          required: true,
          type: 'password'
        },
        identity: {
          required: true,
          type: 'text'
        }
      },
      type: 'fieldset'
    }
  }

  public async handle (data: AuthLoginPostData, response: ServerResponse): Promise<Struct | undefined> {
    const user = await this.selectUserByIdentity(data.body.identity)

    if (user === undefined) {
      response.statusCode = 401
      throw new Error('User in database is undefined')
    }

    return this.login(data, response, user)
  }
}
