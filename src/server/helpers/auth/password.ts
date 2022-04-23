import { randomBytes, scrypt, timingSafeEqual } from 'crypto'

export interface AuthPasswordOptions {
  hash: Buffer
  hashLength: number
  salt: Buffer
  saltLength: number
}

export class AuthPassword {
  public static options?: Partial<AuthPasswordOptions>

  public hash: Buffer

  public hashLength: number

  public salt: Buffer

  public saltLength: number

  public constructor (options?: Partial<AuthPasswordOptions>) {
    const passwordOptions = {
      ...AuthPassword.options,
      ...options
    }

    this.hash = passwordOptions.hash ?? Buffer.from('')
    this.hashLength = passwordOptions.hashLength ?? 64
    this.salt = passwordOptions.salt ?? Buffer.from('')
    this.saltLength = passwordOptions.saltLength ?? 8
  }

  public static parse (string: string): AuthPassword {
    const [
      saltLength,
      hashLength,
      salt,
      hash
    ] = string.split(':')

    return new AuthPassword({
      hash: Buffer.from(hash, 'hex'),
      hashLength: Number(hashLength),
      salt: Buffer.from(salt, 'hex'),
      saltLength: Number(saltLength)
    })
  }

  public async generate (password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.salt = randomBytes(this.saltLength)

      scrypt(password, this.salt, this.hashLength, (error, hash) => {
        if (error === null) {
          this.hash = hash
          resolve()
        } else {
          reject(error)
        }
      })
    })
  }

  public toString (): string {
    return `${this.saltLength}:${this.hashLength}:${this.salt.toString('hex')}:${this.hash.toString('hex')}`
  }

  public async validate (password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      scrypt(password, this.salt, this.hashLength, (error, derivedHash) => {
        if (error === null) {
          resolve(timingSafeEqual(this.hash, derivedHash))
        } else {
          reject(error)
        }
      })
    })
  }
}
