import { authenticator, hotp } from 'otplib'
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
      if (user.auth_totp === null) {
        if (user.auth_hotp_tel === null) {
          return this.handleHotpEmail(response, user)
        }

        return this.handleHotpTel(response, user)
      }

      return this.handleTotp(response, user)
    }

    await this.auth.login(response, user)
    await this.auth.clearBackoff(data)

    if (user.preferences.auth_login_email === true) {
      await this.sendEmail(user, 'auth_login_email', {
        user
      })
    }

    return undefined
  }

  protected async handleHotpEmail (response: ServerResponse, user: User): Promise<Struct> {
    if (user.auth_hotp_email === null) {
      response.statusCode = 401
      throw new Error('HOTP email in database is null')
    }

    if (user.auth_hotp_email_confirmed !== true) {
      response.statusCode = 401
      throw new Error('HOTP email is not confirmed')
    }

    const secret = authenticator.generateSecret()
    const counter = Math.round(Math.random() * 1_000_000)
    const otp = hotp.generate(secret, counter)
    const token = this.auth.createUserToken(user, this.px)

    user.auth_hotp = `${secret}:${counter}`

    await this.sendEmail({
      email: user.auth_hotp_email,
      name: user.name,
      user_id: user.user_id
    }, 'auth_hotp_email', {
      otp,
      token,
      user
    })

    await this.store.set(`sc-auth-mfa-${token.hash}`, JSON.stringify({
      hotp: user.auth_hotp,
      user_id: user.user_id
    }), {
      PX: this.px
    })

    response.setHeader('Set-Cookie', this.auth.createCookie(token))

    return {
      email: user.auth_hotp_email,
      type: 'hotp'
    }
  }

  protected async handleHotpTel (response: ServerResponse, user: User): Promise<Struct> {
    if (user.auth_hotp_tel === null) {
      response.statusCode = 401
      throw new Error('HOTP tel in database is null')
    }

    if (user.auth_hotp_tel_confirmed !== true) {
      response.statusCode = 401
      throw new Error('HOTP tel is not confirmed')
    }

    const secret = authenticator.generateSecret()
    const counter = Math.round(Math.random() * 1_000_000)
    const otp = hotp.generate(secret, counter)
    const token = this.auth.createUserToken(user, this.px)

    user.auth_hotp = `${secret}:${counter}`

    await this.sendSms({
      name: user.name,
      tel: user.auth_hotp_tel,
      user_id: user.user_id
    }, 'auth_hotp_sms', {
      otp,
      token,
      user
    })

    await this.store.set(`sc-auth-mfa-${token.hash}`, JSON.stringify({
      auth_hotp: user.auth_hotp,
      user_id: user.user_id
    }), {
      PX: this.px
    })

    response.setHeader('Set-Cookie', this.auth.createCookie(token))

    return {
      tel: user.auth_hotp_tel,
      type: 'hotp'
    }
  }

  protected async handleTotp (response: ServerResponse, user: User): Promise<Struct> {
    if (user.auth_totp === null) {
      response.statusCode = 401
      throw new Error('TOTP secret in database is null')
    }

    if (user.auth_totp_confirmed !== true) {
      response.statusCode = 401
      throw new Error('TOTP is not confirmed')
    }

    const token = this.auth.createUserToken(user, this.px)

    await this.store.set(`sc-auth-mfa-${token.hash}`, JSON.stringify({
      user_id: user.user_id
    }), {
      PX: this.px
    })

    response.setHeader('Set-Cookie', this.auth.createCookie(token))

    return {
      type: 'totp'
    }
  }
}
