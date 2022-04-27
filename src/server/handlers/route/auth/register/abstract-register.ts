import { AuthHandler } from '../auth'
import type { User } from '../../../../../common'
import { sql } from '../../../../helpers'

export abstract class AuthRegisterHandler extends AuthHandler {
  protected async selectUserByIdentities (user: Pick<User, 'email' | 'tel' | 'username'>): Promise<User | undefined> {
    return this.database.select<User, User>(sql`
      SELECT $[user].*
      FROM $[user]
      WHERE
        $[email] = $(email) OR
        $[tel] = $(tel) OR
        $[username] = $(username)
    `, {
      email: user.email,
      tel: user.tel,
      username: user.username
    })
  }
}
