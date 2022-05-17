import { AuthHandler } from '../auth'
import type { User } from '../../../../../common'
import { sql } from '../../../../helpers'

export abstract class AuthRegisterHandler extends AuthHandler {
  protected async selectUserByIdentities (user: Pick<User, 'identity_email' | 'identity_tel' | 'identity_username'>): Promise<User | undefined> {
    return this.database.select<User, User>(sql`
      SELECT $[user].*
      FROM $[user]
      WHERE
        $[identity_email] = $(identity_email) OR
        $[identity_tel] = $(identity_tel) OR
        $[identity_username] = $(identity_username)
    `, {
      identity_email: user.identity_email,
      identity_tel: user.identity_tel,
      identity_username: user.identity_username
    })
  }
}
