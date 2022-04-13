import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'

interface AuthLoginPostData extends RouteData {
  body: {
    password: string
    username: string
  }
}

export class AuthLoginPostHandler extends AuthHandler {
  public schema = {
    body: {
      required: true,
      schema: {
        password: {
          required: true,
          type: 'text'
        },
        username: {
          required: true,
          type: 'text'
        }
      },
      type: 'struct'
    }
  }

  public async handle (data: AuthLoginPostData, response: ServerResponse): Promise<void> {
    const user = await this.auth.selectUserByUsername(data.body.username)

    if (user === undefined) {
      response.statusCode = 401
      throw new Error('User is undefined')
    }

    if (user.auth_password === null) {
      response.statusCode = 401
      throw new Error('Password is null')
    }

    if (!(await this.auth.validatePassword(user, data.body.password))) {
      response.statusCode = 401
      throw new Error('Password is not valid')
    }

    await this.auth.login(response, user)
    await this.auth.clearBackoff(data)

    if (user.preferences.auth_login_email === true) {
      await this.sendEmail(user, 'auth_login_email', {
        user
      })
    }
  }
}
