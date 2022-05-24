import { AuthHandler } from '../../auth'
import type { RouteData } from '../../../../helpers'
import type { User } from '../../../../../common'
import { sql } from '../../../../helpers'

export class AuthUserSelectHandler extends AuthHandler {
  public authenticate = true

  public async handle (data: RouteData): Promise<User> {
    return this.database.selectOne<User, User>(sql`
      SELECT
        $[email_auth_login],
        $[email_auth_update],
        $[i18n_locale],
        $[i18n_time_zone],
        $[identity_email],
        $[identity_name],
        $[identity_tel_country_code],
        $[identity_tel_national],
        $[identity_username],
        $[user_id]
      FROM $[user]
      WHERE $[user_id] = $(user_id)
    `, {
      user_id: data.user?.user_id
    })
  }
}
