import type { RouteData, RouteHandlerOptions } from '../../../../helpers'
import { AuthHandler } from '../auth'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../../../common'
import { randomBytes } from 'crypto'

export interface AuthRegisterPostCodesRequestHandlerOptions extends Partial<RouteHandlerOptions> {
  count?: number
  length?: number[]
}

export class AuthRegisterPostCodesRequestHandler extends AuthHandler {
  public authenticate = true

  public count: number

  public length: number[]

  public method = 'POST'

  public constructor (options?: AuthRegisterPostCodesRequestHandlerOptions) {
    super(options)
    this.count = options?.count ?? 5
    this.length = options?.length ?? [5]
  }

  public async handle (data: RouteData, response: ServerResponse): Promise<Struct> {
    if (data.user === undefined) {
      response.statusCode = 401
      throw new Error('User is undefined')
    }

    const codes = new Array(this.count)
      .fill('')
      .map(() => {
        return this.length
          .map((length) => {
            return randomBytes(length).toString('hex')
          })
          .join('-')
      })
      .join('\n')

    const token = await this.auth.login(data, response, data.user)

    await this.auth.setTmpUser({
      ...data.user,
      auth_codes: codes
    }, token)

    return {
      auth_codes: codes
    }
  }
}
