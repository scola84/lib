import { AuthRegisterHandler } from './abstract-register'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'

export class AuthRegisterPostCodesConfirmHandler extends AuthRegisterHandler {
  public authenticate = true

  public method = 'POST'

  public async handle (data: RouteData, response: ServerResponse): Promise<void> {
    const tmpUser = await this.getTmpUser(data, response)

    await this.updateUserCodes(tmpUser)
  }
}
