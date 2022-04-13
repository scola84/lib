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
  public schema = {
    body: {
      required: true,
      schema: {
        password: {
          required: true,
          type: 'text'
        }
      },
      type: 'struct'
    }
  }

  public async handle (data: AuthLoginPostPasswordData, response: ServerResponse): Promise<Struct | undefined> {
    const hash = this.auth.extractTokenHash(data)

    if (hash === undefined) {
      response.statusCode = 401
      throw new Error('Hash is undefined')
    }

    const storedUser = await this.store.getDel(`sc-auth-mfa-${hash}`)

    if (storedUser === null) {
      response.statusCode = 401
      throw new Error('Stored user is null')
    }

    const parsedUser = JSON.parse(storedUser) as User
    const user = await this.auth.selectUser(parsedUser.user_id)

    if (user === undefined) {
      response.statusCode = 401
      throw new Error('User is undefined')
    }

    if (!user.active) {
      response.statusCode = 401
      throw new Error('User is not active')
    }

    if (user.password === null) {
      response.statusCode = 401
      throw new Error('Password is null')
    }

    if (!(await this.auth.validatePassword(user, data.body.password))) {
      response.statusCode = 401
      throw new Error('Password is not valid')
    }

    if (user.mfa) {
      if (user.totp_secret === null) {
        if (user.hotp_tel === null) {
          return this.handleHotpEmail(response, user)
        }

        return this.handleHotpTel(response, user)
      }

      return this.handleTotp(response, user)
    }

    await this.auth.login(response, user)
    await this.auth.clearBackoff(data)

    if (user.email_prefs?.after_login === true) {
      await this.sendEmail(user, 'auth_login_email', {
        user
      })
    }

    return undefined
  }

  protected async handleHotpEmail (response: ServerResponse, user: User): Promise<Struct> {
    if (user.hotp_email === null) {
      response.statusCode = 401
      throw new Error('HOTP email is null')
    }

    const secret = authenticator.generateSecret()
    const counter = Math.round(Math.random() * 1_000_000)
    const otp = hotp.generate(secret, counter)
    const token = this.auth.createUserToken(user, this.px)

    user.hotp_secret = `${secret}:${counter}`

    await this.sendEmail({
      email: user.hotp_email,
      name: user.name
    }, 'auth_hotp_email', {
      otp,
      token,
      user
    })

    await this.store.set(`sc-auth-mfa-${token.hash}`, JSON.stringify({
      hotp_secret: user.hotp_secret,
      user_id: user.user_id
    }), {
      PX: this.px
    })

    response.setHeader('Set-Cookie', this.auth.createCookie(token))

    return {
      email: user.hotp_email,
      type: 'hotp'
    }
  }

  protected async handleHotpTel (response: ServerResponse, user: User): Promise<Struct> {
    if (user.hotp_tel === null) {
      throw new Error('HOTP tel is null')
    }

    const secret = authenticator.generateSecret()
    const counter = Math.round(Math.random() * 1_000_000)
    const otp = hotp.generate(secret, counter)
    const token = this.auth.createUserToken(user, this.px)

    user.hotp_secret = `${secret}:${counter}`

    await this.sendSms({
      tel: user.hotp_tel
    }, 'auth_hotp_sms', {
      otp,
      token,
      user
    })

    await this.store.set(`sc-auth-mfa-${token.hash}`, JSON.stringify({
      hotp_secret: user.hotp_secret,
      user_id: user.user_id
    }), {
      PX: this.px
    })

    response.setHeader('Set-Cookie', this.auth.createCookie(token))

    return {
      tel: user.hotp_tel,
      type: 'hotp'
    }
  }

  protected async handleTotp (response: ServerResponse, user: User): Promise<Struct> {
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
