import type { RouteData, RouteHandlerOptions } from '../../../../helpers'
import { AuthCodes } from '../../../../helpers'
import { AuthRegisterHandler } from './abstract-register'
import type { Result } from '../../../../../common'
import type { ServerResponse } from 'http'
import { createUser } from '../../../../../common'

export interface AuthRegisterPostCodesRequestHandlerOptions extends Partial<RouteHandlerOptions> {
  count?: number
  length?: number[]
}

export class AuthRegisterPostCodesRequestHandler extends AuthRegisterHandler {
  public authenticate = true

  public count: number

  public length: number[]

  public method = 'POST'

  public constructor (options?: AuthRegisterPostCodesRequestHandlerOptions) {
    super(options)
    this.count = options?.count ?? 5
    this.length = options?.length ?? [5]
  }

  public async handle (data: RouteData, response: ServerResponse): Promise<Result> {
    if (data.user?.token === undefined) {
      response.statusCode = 401
      throw new Error('Token is undefined')
    }

    const codes = new AuthCodes()

    await this.setTmpUser(createUser({
      auth_codes: codes.toString(),
      auth_codes_confirmed: true,
      user_id: data.user.user_id
    }), data.user.token)

    return {
      code: 'ok_register_codes_request',
      data: {
        auth_codes: codes.codes.join('\n')
      }
    }
  }
}
