import { AuthPassword } from '../../../../helpers'
import { AuthRegisterPasswordHandler } from './abstract-password'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'

interface AuthRegisterPostPasswordData extends RouteData {
  body: {
    auth_password: string
  }
}

export class AuthRegisterPostPasswordHandler extends AuthRegisterPasswordHandler {
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

  public async handle (data: AuthRegisterPostPasswordData, response: ServerResponse): Promise<Struct> {
    const tmpUser = await this.getTmpUser(data, response)
    const user = await this.selectUserByIdentities(tmpUser)

    if (user !== undefined) {
      response.statusCode = 401
      throw new Error('User in database is defined')
    }

    const password = new AuthPassword()

    await password.generate(data.body.auth_password)

    await this.register(data, response, {
      ...tmpUser,
      auth_password: password.toString()
    })

    return {
      code: 'ok_auth_register_password'
    }
  }
}
