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
  public method = 'POST'

  public schema = {
    body: {
      required: true,
      schema: {
        username: {
          required: true,
          type: 'text'
        }
      },
      type: 'fieldset'
    }
  }

  public async handle (data: AuthLoginPostUsernameData, response: ServerResponse): Promise<Struct> {
    const user = await this.auth.selectUserByUsername(data.body.username)

    if (user === undefined) {
      response.statusCode = 401
      throw new Error('User in database is undefined')
    }

    return this.auth.requestFirstFactor(response, user)
  }
}
