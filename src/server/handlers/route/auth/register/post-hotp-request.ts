import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'
import { createUser } from '../../../../entities'

interface AuthRegisterPostHotpRequestData extends RouteData {
  body: {
    email?: string
    tel?: string
  }
}

export class AuthRegisterPostHotpRequestHandler extends AuthHandler {
  public authenticate = true

  public method = 'POST'

  public schema = {
    body: {
      required: true,
      schema: {
        email: {
          type: 'email'
        },
        tel: {
          type: 'tel'
        }
      },
      type: 'fieldset'
    }
  }

  public async handle (data: AuthRegisterPostHotpRequestData, response: ServerResponse): Promise<Struct> {
    if (data.user?.token === undefined) {
      response.statusCode = 401
      throw new Error('Token is undefined')
    }

    if (
      data.body.email === undefined &&
      data.body.tel === undefined
    ) {
      response.statusCode = 401
      throw new Error('Email and tel are undefined')
    }

    const hotp = this.auth.createHotp()

    if (data.body.email !== undefined) {
      const user = createUser({
        auth_hotp: `${hotp.secret.base32}:${hotp.counter}`,
        auth_hotp_email: data.body.email,
        auth_hotp_email_confirmed: true,
        user_id: data.user.user_id
      })

      await this.auth.setTmpUser(user, data.user.token)

      await this.smtp?.send(await this.smtp.create('auth_register_hotp_email', {
        hotp: hotp.generate(),
        user: user
      }, {
        email: data.body.email,
        name: data.user.name,
        preferences: data.user.preferences
      }))

      return {
        email: user.auth_hotp_email
      }
    } else if (data.body.tel !== undefined) {
      const user = createUser({
        auth_hotp: `${hotp.secret.base32}:${hotp.counter}`,
        auth_hotp_tel: data.body.tel,
        auth_hotp_tel_confirmed: true,
        user_id: data.user.user_id
      })

      await this.auth.setTmpUser(user, data.user.token)

      await this.sms?.send(await this.sms.create('auth_register_hotp_sms', {
        hotp: hotp.generate(),
        user: user
      }, {
        preferences: data.user.preferences,
        tel: data.body.tel
      }))

      return {
        tel: user.auth_hotp_tel
      }
    }

    response.statusCode = 401
    throw new Error('HOTP is undefined')
  }
}