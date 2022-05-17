import { AuthHandler } from '../auth'
import type { Result } from '../../../../../common'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'

export class AuthUnregisterPostCodesConfirmHandler extends AuthHandler {
  public authenticate = true

  public method = 'POST'

  public async handle (data: RouteData, response: ServerResponse): Promise<Result> {
    const tmpUser = await this.getTmpUser(data, response)

    await this.updateUserCodes(tmpUser)
    return {
      code: 'ok_unregister_codes_confirm'
    }
  }
}
