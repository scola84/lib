import { AuthHandler } from '../auth'
import type { User } from '../../../../../common'

export abstract class AuthLoginHandler extends AuthHandler {
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
      url: `${this.origin}?next=auth_reset_request`,
      user: user
    }, {
      i18n_locale: user.i18n_locale,
      identity_email: user.identity_email,
      identity_name: user.identity_name
    }))
  }
}
