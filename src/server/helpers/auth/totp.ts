import { TOTP, URI } from 'otpauth'

export interface AuthTotpOptions {
  issuer: string
  label: string
  algorithm: string
  digits: number
  counter: number
  window: number
}

export class AuthTotp extends TOTP {
  public static options?: AuthTotpOptions

  public constructor (options?: Partial<AuthTotpOptions>) {
    super({
      ...AuthTotp.options,
      ...options
    })
  }

  public static parse (string: string): AuthTotp {
    return new AuthTotp(URI.parse(string))
  }
}
