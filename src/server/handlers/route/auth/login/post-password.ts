import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'
import type { User } from '../../../../entities'

interface AuthLoginPostPasswordData extends RouteData {
  body: {
    password: string
  }
}

export class AuthLoginPostPasswordHandler extends AuthHandler {
  public method = 'POST'

  public schema = {
    body: {
      required: true,
      schema: {
        password: {
          required: true,
          type: 'password'
        }
      },
      type: 'fieldset'
    }
  }

  public async handle (data: AuthLoginPostPasswordData, response: ServerResponse): Promise<Struct | undefined> {
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
