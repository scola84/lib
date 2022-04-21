import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { User } from '../../../../entities'

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

    const existingUser = await this.auth.selectUserByIdentities(tmpUser)

    if (existingUser !== undefined) {
      response.statusCode = 401
      throw new Error('User in database is defined')
    }

    await this.register(data, response, {
      ...tmpUser,
      auth_password: await this.auth.createPassword(data.body.password)
    })
  }

  protected async register (data: AuthRegisterPostPasswordData, response: ServerResponse, user: User): Promise<void> {
    await this.auth.register(user)
    await this.auth.login(response, user)

    if (user.email !== null) {
      await this.smtp?.send(await this.smtp.create('auth_register_email', {
        user
      }, user))
    } else if (user.tel !== null) {
      await this.sms?.send(await this.sms.create('auth_register_sms', {
        user
      }, user))
    }

    await this.auth.clearBackoff(data)
  }
}
