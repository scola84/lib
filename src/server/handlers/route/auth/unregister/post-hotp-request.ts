import { createUser, toString } from '../../../../../common'
import { AuthHandler } from '../auth'
import { AuthHotp } from '../../../../helpers'
import type { Result } from '../../../../../common'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'

interface AuthUnregisterPostHotpRequestData extends RouteData {
  body: {
    email?: boolean
    tel?: boolean
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
          type: 'boolean'
        },
        tel: {
          type: 'boolean'
        }
      },
      type: 'fieldset'
    }
  }

  public async handle (data: AuthUnregisterPostHotpRequestData, response: ServerResponse): Promise<Result> {
    if (data.body.email === true) {
      return this.requestHotpEmail(data, response)
    } else if (data.body.tel === true) {
      return this.requestHotpTel(data, response)
    }

    response.statusCode = 401
    throw new Error('HOTP is undefined')
  }

  protected async requestHotpEmail (data: AuthUnregisterPostHotpRequestData, response: ServerResponse): Promise<Result> {
    if (data.user?.token === undefined) {
      response.statusCode = 401
      throw new Error('Token is undefined')
    }

    if (data.user.auth_hotp_email === null) {
      response.statusCode = 401
      throw new Error('Email is null')
    }

    const hotp = new AuthHotp()
    const email = data.user.auth_hotp_email

    const tmpUser = createUser({
      auth_hotp: hotp.toString(),
      auth_hotp_email: null,
      auth_hotp_email_confirmed: false,
      user_id: data.user.user_id
    })

    await this.setTmpUser(tmpUser, data.user.token)

    this.smtp
      ?.send(await this.smtp.create('auth_unregister_hotp', {
        date: new Date(),
        date_time_zone: data.user.preferences.time_zone,
        token: hotp.generate(),
        user: data.user
      }, {
        email: email,
        name: data.user.name,
        preferences: data.user.preferences
      }))
      .catch((error) => {
        this.logger?.error({
          context: 'request-hotp-email'
        }, toString(error))
      })

    return {
      code: 'ok_auth_unregister_hotp_email_request',
      data: {
        email: email
          .slice(email.indexOf('@'))
          .padStart(email.length, '*')
      }
    }
  }

  protected async requestHotpTel (data: AuthUnregisterPostHotpRequestData, response: ServerResponse): Promise<Result> {
    if (data.user?.token === undefined) {
      response.statusCode = 401
      throw new Error('Token is undefined')
    }

    if (data.user.auth_hotp_tel_national === null) {
      response.statusCode = 401
      throw new Error('Tel is null')
    }

    const hotp = new AuthHotp()
    const tel = data.user.auth_hotp_tel

    await this.setTmpUser(createUser({
      auth_hotp: hotp.toString(),
      auth_hotp_tel_confirmed: false,
      auth_hotp_tel_country_code: null,
      auth_hotp_tel_national: null,
      user_id: data.user.user_id
    }), data.user.token)

    this.sms
      ?.send(await this.sms.create('auth_unregister_hotp', {
        date: new Date(),
        date_time_zone: data.user.preferences.time_zone,
        token: hotp.generate(),
        user: data.user
      }, {
        preferences: data.user.preferences,
        tel: tel
      }))
      .catch((error) => {
        this.logger?.error({
          context: 'request-hotp-tel'
        }, toString(error))
      })

    return {
      code: 'ok_auth_unregister_hotp_tel_request',
      data: {
        tel: tel
          .slice(-4)
          .padStart(tel.length, '*')
      }
    }
  }
}
