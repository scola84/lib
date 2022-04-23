import { randomBytes } from 'crypto'

export interface AuthCodesOptions {
  codes: string[]
  count: number
  length: number[]
}

export class AuthCodes {
  public static options?: AuthCodesOptions

  public codes: string[]

  public count: number

  public length: number[]

  public constructor (options?: Partial<AuthCodesOptions>) {
    const codesOptions = {
      ...AuthCodes.options,
      ...options
    }

    this.count = codesOptions.count ?? 5
    this.length = codesOptions.length ?? [5]
    this.codes = codesOptions.codes ?? this.generate()
  }

  public static parse (string: string): AuthCodes {
    const [
      count,
      length,
      codes
    ] = string.split(':')

    return new AuthCodes({
      codes: codes.split('\n'),
      count: Number(count),
      length: length.split(',').map(Number)
    })
  }

  public generate (): string[] {
    return new Array(this.count)
      .fill('')
      .map(() => {
        return this.length
          .map((length) => {
            return randomBytes(length).toString('hex')
          })
          .join('-')
      })
  }

  public toString (): string {
    return [
      this.count,
      this.length.join(','),
      this.codes.join('\n')
    ].join(':')
  }

  public validate (code: string): boolean {
    const index = this.codes.indexOf(code)

    if (index !== -1) {
      this.codes.splice(index, 1)
      return true
    }

    return false
  }
}
