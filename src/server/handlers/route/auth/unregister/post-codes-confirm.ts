import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'

export class AuthUnregisterPostCodesConfirmHandler extends AuthHandler {
  public authenticate = true

  public method = 'POST'

  public async handle (data: RouteData, response: ServerResponse): Promise<void> {
    const tmpUser = await this.getTmpUser(data, response)

    await this.updateUserCodes(tmpUser)
  }
}
