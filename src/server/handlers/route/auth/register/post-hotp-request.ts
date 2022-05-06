import { AuthHotp } from '../../../../helpers'
import { AuthRegisterHandler } from './abstract-register'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'
import { createUser } from '../../../../../common'

interface AuthRegisterPostHotpRequestData extends RouteData {
  body: {
    email?: string
    tel?: string
  }
}

export class AuthRegisterPostHotpRequestHandler extends AuthRegisterHandler {
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
    if (data.body.email !== undefined) {
      return this.requestHotpEmail(data, response, data.body.email)
    } else if (data.body.tel !== undefined) {
      return this.requestHotpTel(data, response, data.body.tel)
    }

    response.statusCode = 401
    throw new Error('HOTP is undefined')
  }

  protected async requestHotpEmail (data: AuthRegisterPostHotpRequestData, response: ServerResponse, email: string): Promise<Struct> {
    if (data.user?.token === undefined) {
      response.statusCode = 401
      throw new Error('Token is undefined')
    }

    const hotp = new AuthHotp()

    const tmpUser = createUser({
      auth_hotp: hotp.toString(),
      auth_hotp_email: email,
      auth_hotp_email_confirmed: true,
      user_id: data.user.user_id
    })

    await this.setTmpUser(tmpUser, data.user.token)

    await this.smtp?.send(await this.smtp.create('auth_register_hotp', {
      date: new Date(),
      date_tz: data.user.preferences.time_zone,
      token: hotp.generate(),
      user: data.user
    }, {
      email: email,
      name: data.user.name,
      preferences: data.user.preferences
    }))

    return {
      code: 'ok_auth_register_hotp_email_request',
      data: {
        email: email
          .slice(email.indexOf('@'))
          .padStart(email.length, '*')
      }
    }
  }

  protected async requestHotpTel (data: AuthRegisterPostHotpRequestData, response: ServerResponse, tel: string): Promise<Struct> {
    if (data.user?.token === undefined) {
      response.statusCode = 401
      throw new Error('Token is undefined')
    }

    const hotp = new AuthHotp()

    await this.setTmpUser(createUser({
      auth_hotp: hotp.toString(),
      auth_hotp_tel: tel,
      auth_hotp_tel_confirmed: true,
      user_id: data.user.user_id
    }), data.user.token)

    await this.sms?.send(await this.sms.create('auth_register_hotp', {
      date: new Date(),
      date_tz: data.user.preferences.time_zone,
      token: hotp.generate(),
      user: data.user
    }, {
      preferences: data.user.preferences,
      tel: tel
    }))

    return {
      code: 'ok_auth_register_hotp_tel_request',
      data: {
        tel: tel
          .slice(-4)
          .padStart(tel.length, '*')
      }
    }
  }
}
