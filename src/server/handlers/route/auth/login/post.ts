import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'

interface AuthLoginPostData extends RouteData {
  body: {
    password: string
    username: string
  }
}

export class AuthLoginPostHandler extends AuthHandler {
  public method = 'POST'

  public schema = {
    body: {
      required: true,
      schema: {
        password: {
          required: true,
          type: 'password'
        },
        username: {
          required: true,
          type: 'text'
        }
      },
      type: 'fieldset'
    }
  }

  public async handle (data: AuthLoginPostData, response: ServerResponse): Promise<Struct | undefined> {
    const user = await this.auth.selectUserByUsername(data.body.username)

    if (user === undefined) {
      response.statusCode = 401
      throw new Error('User in database is undefined')
    }

    if (user.auth_password === null) {
      response.statusCode = 401
      throw new Error('Password in database is null')
    }

    if (!(await this.auth.validatePassword(user, data.body.password))) {
      response.statusCode = 401
      throw new Error('Password is not valid')
    }

    if (user.auth_mfa === true) {
      return this.auth.requestSecondFactor(response, user)
    }

    await this.auth.login(response, user)
    await this.auth.clearBackoff(data)
    return undefined
  }
}
