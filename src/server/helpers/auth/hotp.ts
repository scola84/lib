import { HOTP, URI } from 'otpauth'

export interface AuthHotpOptions {
  issuer: string
  label: string
  algorithm: string
  digits: number
  counter: number
  window: number
}

export class AuthHotp extends HOTP {
  public static options?: AuthHotpOptions

  public constructor (options?: Partial<AuthHotpOptions>) {
    super({
      counter: Math.round(Math.random() * 1000 * 1000),
      ...AuthHotp.options,
      ...options
    })
  }

  public static parse (string: string): AuthHotp {
    return new AuthHotp(URI.parse(string))
  }
}
