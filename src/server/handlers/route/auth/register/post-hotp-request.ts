import { HOTP, Secret } from 'otpauth'
import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'

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

  public async handle (data: AuthRegisterPostHotpRequestData, response: ServerResponse): Promise<Struct | undefined> {
    if (data.user === undefined) {
      response.statusCode = 401
      throw new Error('User is undefined')
    }

    if (
      data.body.email === undefined &&
      data.body.tel === undefined
    ) {
      response.statusCode = 401
      throw new Error('Email and tel are undefined')
    }

    const secret = new Secret()
    const counter = Math.round(Math.random() * 1_000_000)

    const otp = HOTP.generate({
      counter,
      secret
    })

    const token = await this.auth.login(data, response, data.user)

    const user = {
      ...data.user,
      auth_hotp: `${secret.base32}:${counter}`,
      auth_hotp_email: data.body.email ?? null,
      auth_hotp_tel: data.body.tel ?? null
    }

    await this.auth.setTmpUser(user, token)

    if (user.auth_hotp_email !== null) {
      await this.smtp?.send(await this.smtp.create('auth_register_hotp_email', {
        otp,
        token,
        user
      }, {
        ...user,
        email: user.auth_hotp_email
      }))

      return {
        email: user.auth_hotp_email
      }
    } else if (user.auth_hotp_tel !== null) {
      await this.sms?.send(await this.sms.create('auth_register_hotp_sms', {
        otp,
        token,
        user
      }, {
        ...user,
        tel: user.auth_hotp_tel
      }))

      return {
        tel: user.auth_hotp_tel
      }
    }

    return undefined
  }
}
