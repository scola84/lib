import { AuthLoginPostPasswordHandler } from './post-password'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'

interface AuthLoginPostData extends RouteData {
  body: {
    identity: string
    password: string
  }
}

export class AuthLoginPostHandler extends AuthLoginPostPasswordHandler {
  public method = 'POST'

  public schema = {
    body: {
      required: true,
      schema: {
        identity: {
          required: true,
          type: 'text'
        },
        password: {
          required: true,
          type: 'password'
        }
      },
      type: 'fieldset'
    }
  }

  public async handle (data: AuthLoginPostData, response: ServerResponse): Promise<Struct | undefined> {
    const user = await this.auth.selectUserByIdentity(data.body.identity)

    if (user === undefined) {
      response.statusCode = 401
      throw new Error('User in database is undefined')
    }

    return this.login(data, response, user)
  }
}
