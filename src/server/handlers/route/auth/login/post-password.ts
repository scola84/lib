import { AuthLoginPasswordHandler } from './abstract-password'
import type { Flow } from '../../../../../common'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'

interface AuthLoginPostPasswordData extends RouteData {
  body: {
    auth_password: string
  }
}

export class AuthLoginPostPasswordHandler extends AuthLoginPasswordHandler {
  public method = 'POST'

  public schema = {
    body: {
      required: true,
      schema: {
        auth_password: {
          required: true,
          type: 'password'
        }
      },
      type: 'fieldset'
    }
  }

  public async handle (data: AuthLoginPostPasswordData, response: ServerResponse): Promise<Flow | undefined> {
    const user = await this.selectTmpUser(data, response)
    return this.login(data, response, user)
  }
}
