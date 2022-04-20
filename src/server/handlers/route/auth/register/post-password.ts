import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'

interface AuthRegisterPostPasswordData extends RouteData {
  body: {
    password: string
  }
}

export class AuthRegisterPostPasswordHandler extends AuthHandler {
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

  public async handle (data: AuthRegisterPostPasswordData, response: ServerResponse): Promise<void> {
    const hash = this.auth.getHash(data)

    if (hash === undefined) {
      response.statusCode = 401
      throw new Error('Hash is undefined')
    }

    const tmpUser = await this.auth.getDelTmpUser(hash)

    if (tmpUser === null) {
      response.statusCode = 401
      throw new Error('User in store is null')
    }

    const user = await this.auth.register({
      ...tmpUser,
      auth_password: await this.auth.createPassword(data.body.password)
    })

    await this.auth.login(data, response, user)
    await this.auth.sendRegisterEmail(user)
    await this.auth.clearBackoff(data)
  }
}
