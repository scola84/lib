import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'

export class AuthLogoutPostHandler extends AuthHandler {
  public authenticate = true

  public method = 'POST'

  public async handle (data: RouteData, response: ServerResponse): Promise<void> {
    await this.auth.logout(response, data.user)
  }
}
