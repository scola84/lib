import { AuthRegisterHandler } from './abstract-register'
import type { Result } from '../../../../../common'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'

export class AuthRegisterPostCodesConfirmHandler extends AuthRegisterHandler {
  public authenticate = true

  public method = 'POST'

  public async handle (data: RouteData, response: ServerResponse): Promise<Result> {
    const tmpUser = await this.getTmpUser(data, response)

    await this.updateUserCodes(tmpUser)
    return {
      code: 'ok_auth_register_codes_confirm'
    }
  }
}
