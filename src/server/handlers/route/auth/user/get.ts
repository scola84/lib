import { AuthHandler } from '../../auth'
import type { RouteData } from '../../../../helpers'
import type { User } from '../../../../../common'
import { sql } from '../../../../helpers'

export class AuthUserGetHandler extends AuthHandler {
  public authenticate = true

  public async handle (data: RouteData): Promise<User> {
    return this.database.selectOne<User, User>(sql`
      SELECT
        $[preferences],
        $[user_id]
      FROM $[user]
      WHERE $[user_id] = $(user_id)
    `, {
      user_id: data.user?.user_id
    })
  }
}
