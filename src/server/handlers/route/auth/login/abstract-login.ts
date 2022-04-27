import { AuthHandler } from '../auth'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import type { User } from '../../../../../common'
import { sql } from '../../../../helpers'

export abstract class AuthLoginHandler extends AuthHandler {
  protected async selectUser (data: RouteData, response: ServerResponse): Promise<User> {
    const tmpUser = await this.getTmpUser(data, response)

    const user = await this.database.select<User, User>(sql`
      SELECT $[user].*
      FROM $[user]
      WHERE $[user_id] = $(user_id)
    `, {
      user_id: tmpUser.user_id
    })

    if (user === undefined) {
      response.statusCode = 401
      throw new Error('User in database is undefined')
    }

    return user
  }

  protected async selectUserByIdentity (identity: string): Promise<User | undefined> {
    return this.database.select<User, User>(sql`
      SELECT $[user].*
      FROM $[user]
      WHERE
        $[email] = $(email) OR
        $[tel] = $(tel) OR
        $[username] = $(username)
    `, {
      email: identity,
      tel: identity,
      username: identity
    })
  }

  protected async sendMessage (user: User): Promise<void> {
    if (
      user.preferences.auth_login_email === true &&
      user.email !== null
    ) {
      await this.sendMessageEmail(user)
    }
  }

  protected async sendMessageEmail (user: User): Promise<void> {
    await this.smtp?.send(await this.smtp.create('auth_login_email', {
      user
    }, {
      email: user.email,
      name: user.name,
      preferences: user.preferences
    }))
  }
}
