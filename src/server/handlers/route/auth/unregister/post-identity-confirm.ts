import type { Result, User } from '../../../../../common'
import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import { sql } from '../../../../helpers'

export class AuthUnregisterPostIdentityConfirmHandler extends AuthHandler {
  public authenticate = true

  public method = 'POST'

  public async handle (data: RouteData, response: ServerResponse): Promise<Result> {
    const tmpUser = await this.getTmpUser(data, response)

    await this.deleteUser(tmpUser)
    await this.auth.logout(response)
    return {
      code: 'ok_auth_unregister_identity_confirm'
    }
  }

  protected async deleteUser (user: Pick<User, 'user_id'>): Promise<void> {
    await this.database.delete<User>(sql`
      DELETE
      FROM $[user]
      WHERE $[user_id] = $(user_id)
    `, {
      user_id: user.user_id
    })
  }
}
