import { AuthHandler } from '../auth'
import { AuthHotp } from '../../../../helpers'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'
import { createUser } from '../../../../entities'

interface AuthUnregisterPostHotpRequestData extends RouteData {
  body: {
    email?: string
    tel?: string
  }
}

export class AuthUnregisterPostHotpRequestHandler extends AuthHandler {
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

  public async handle (data: AuthUnregisterPostHotpRequestData, response: ServerResponse): Promise<Struct> {
    if (data.body.email !== undefined) {
      return this.requestHotpEmail(data, response, data.body.email)
    } else if (data.body.tel !== undefined) {
      return this.requestHotpTel(data, response, data.body.tel)
    }

    response.statusCode = 401
    throw new Error('HOTP is undefined')
  }

  protected async requestHotpEmail (data: AuthUnregisterPostHotpRequestData, response: ServerResponse, email: string): Promise<Struct> {
    if (data.user?.token === undefined) {
      response.statusCode = 401
      throw new Error('Token is undefined')
    }

    const hotp = new AuthHotp()

    const tmpUser = createUser({
      auth_hotp: hotp.toString(),
      auth_hotp_email: null,
      auth_hotp_email_confirmed: false,
      user_id: data.user.user_id
    })

    await this.setTmpUser(tmpUser, data.user.token)

    await this.smtp?.send(await this.smtp.create('auth_register_hotp_email', {
      token: hotp.generate(),
      user: data.user
    }, {
      email: email,
      name: data.user.name,
      preferences: data.user.preferences
    }))

    return {
      email
    }
  }

  protected async requestHotpTel (data: AuthUnregisterPostHotpRequestData, response: ServerResponse, tel: string): Promise<Struct> {
    if (data.user?.token === undefined) {
      response.statusCode = 401
      throw new Error('Token is undefined')
    }

    const hotp = new AuthHotp()

    await this.setTmpUser(createUser({
      auth_hotp: hotp.toString(),
      auth_hotp_tel: null,
      auth_hotp_tel_confirmed: false,
      user_id: data.user.user_id
    }), data.user.token)

    await this.sms?.send(await this.sms.create('auth_register_hotp_tel', {
      token: hotp.generate(),
      user: data.user
    }, {
      preferences: data.user.preferences,
      tel: tel
    }))

    return {
      tel
    }
  }
}
