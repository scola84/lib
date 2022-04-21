import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'

export class AuthUnregisterPostCodesConfirmHandler extends AuthHandler {
  public authenticate = true

  public method = 'POST'

  public async handle (data: RouteData, response: ServerResponse): Promise<void> {
    if (data.user === undefined) {
      response.statusCode = 401
      throw new Error('User is undefined')
    }

    const hash = this.auth.getHash(data)

    if (hash === undefined) {
      response.statusCode = 401
      throw new Error('Hash is undefined')
    }

    const tmpUser = await this.auth.getDelTmpUser(hash)

    if (tmpUser === null) {
      response.statusCode = 401
      throw new Error('User in store is null')
    }

    await this.auth.updateUserCodes(tmpUser)
    await this.auth.login(response, data.user)
    await this.auth.clearBackoff(data)
  }
}