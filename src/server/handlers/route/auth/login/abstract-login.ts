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
        $[identity_email] = $(identity_email) OR
        $[identity_tel] = $(identity_tel) OR
        $[identity_username] = $(identity_username)
    `, {
      identity_email: identity,
      identity_tel: identity,
      identity_username: identity
    })
  }

  protected async sendMessage (user: User): Promise<void> {
    if (
      user.email_auth_login === true &&
      user.identity_email !== null
    ) {
      await this.sendMessageEmail(user)
    }
  }

  protected async sendMessageEmail (user: User): Promise<void> {
    await this.smtp?.send(await this.smtp.create('login', {
      date: new Date(),
      date_time_zone: user.i18n_time_zone,
      url: `${this.origin}?next=auth_reset`,
      user: user
    }, {
      i18n_locale: user.i18n_locale,
      identity_email: user.identity_email,
      identity_name: user.identity_name
    }))
  }
}
