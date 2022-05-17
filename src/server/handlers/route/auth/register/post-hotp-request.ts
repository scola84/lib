import { createUser, toString } from '../../../../../common'
import { AuthHotp } from '../../../../helpers'
import { AuthRegisterHandler } from './abstract-register'
import type { Result } from '../../../../../common'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'

interface AuthRegisterPostHotpRequestData extends RouteData {
  body: {
    auth_hotp_email?: string
    auth_hotp_tel_country_code?: string
    auth_hotp_tel_national?: string
  }
}

export class AuthRegisterPostHotpRequestHandler extends AuthRegisterHandler {
  public authenticate = true

  public method = 'POST'

  public schema = {
    body: {
      required: true,
      schema: {
        auth_hotp_email: {
          type: 'email'
        },
        auth_hotp_tel_country_code: {
          generator: 'sc-tel-country-code',
          type: 'select'
        },
        auth_hotp_tel_national: {
          custom: 'tel-national',
          type: 'tel'
        }
      },
      type: 'fieldset'
    }
  }

  public async handle (data: AuthRegisterPostHotpRequestData, response: ServerResponse): Promise<Result> {
    if (data.body.auth_hotp_email !== undefined) {
      return this.requestHotpEmail(data, response)
    } else if (data.body.auth_hotp_tel_national !== undefined) {
      return this.requestHotpTel(data, response)
    }

    response.statusCode = 401
    throw new Error('HOTP is undefined')
  }

  protected async requestHotpEmail (data: AuthRegisterPostHotpRequestData, response: ServerResponse): Promise<Result> {
    if (data.user?.token === undefined) {
      response.statusCode = 401
      throw new Error('Token is undefined')
    }

    const hotp = new AuthHotp()

    const tmpUser = createUser({
      auth_hotp: hotp.toString(),
      auth_hotp_email: data.body.auth_hotp_email,
      auth_hotp_email_confirmed: true,
      user_id: data.user.user_id
    })

    await this.setTmpUser(tmpUser, data.user.token)

    this.smtp
      ?.send(await this.smtp.create('register_hotp', {
        date: new Date(),
        date_time_zone: data.user.i18n_time_zone,
        token: hotp.generate(),
        user: data.user
      }, {
        i18n_locale: data.user.i18n_locale,
        identity_email: tmpUser.auth_hotp_email,
        identity_name: data.user.identity_name
      }))
      .catch((error) => {
        this.logger?.error({
          context: 'request-hotp-email'
        }, toString(error))
      })

    return {
      code: 'ok_register_hotp_email_request',
      data: {
        email: tmpUser.auth_hotp_email
          ?.slice(tmpUser.auth_hotp_email.indexOf('@'))
          .padStart(tmpUser.auth_hotp_email.length, '*')
      }
    }
  }

  protected async requestHotpTel (data: AuthRegisterPostHotpRequestData, response: ServerResponse): Promise<Result> {
    if (data.user?.token === undefined) {
      response.statusCode = 401
      throw new Error('Token is undefined')
    }

    const hotp = new AuthHotp()

    const tmpUser = createUser({
      auth_hotp: hotp.toString(),
      auth_hotp_tel_confirmed: true,
      auth_hotp_tel_country_code: data.body.auth_hotp_tel_country_code,
      auth_hotp_tel_national: data.body.auth_hotp_tel_national,
      user_id: data.user.user_id
    })

    await this.setTmpUser(tmpUser, data.user.token)

    this.sms
      ?.send(await this.sms.create('register_hotp', {
        date: new Date(),
        date_time_zone: data.user.i18n_time_zone,
        token: hotp.generate(),
        user: data.user
      }, {
        i18n_locale: tmpUser.i18n_locale,
        identity_tel: tmpUser.identity_tel
      }))
      .catch((error) => {
        this.logger?.error({
          context: 'request-hotp-tel'
        }, toString(error))
      })

    return {
      code: 'ok_register_hotp_tel_request',
      data: {
        tel: tmpUser.identity_tel
          .slice(-4)
          .padStart(tmpUser.identity_tel.length, '*')
      }
    }
  }
}
