import type { Result, User } from '../../../../../common'
import { AuthHandler } from '../'
import { AuthPassword } from '../../../../helpers'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import { toString } from '../../../../../common'

interface AuthResetPostConfirmData extends RouteData {
  body: {
    auth_password: string
  }
}

export class AuthResetPostConfirmHandler extends AuthHandler {
  public method = 'POST'

  public schema = {
    body: {
      required: true,
      schema: {
        auth_password: {
          required: true,
          type: 'password'
        }
      },
      type: 'fieldset'
    }
  }

  public async handle (data: AuthResetPostConfirmData, response: ServerResponse): Promise<Result> {
    const user = await this.selectTmpUser(data, response, 'auth_reset_confirm')
    const password = new AuthPassword()

    await password.generate(data.body.auth_password)
    user.auth_password = password.toString()
    await this.updateUserPassword(user)

    this
      .sendMessage(user)
      .catch((error) => {
        this.logger?.error({
          context: 'update'
        }, toString(error))
      })

    return {
      code: 'ok_reset_confirm'
    }
  }

  protected async sendMessage (user: User): Promise<void> {
    if (
      user.email_auth_update === true &&
      user.identity_email !== null
    ) {
      await this.sendMessageEmail(user)
    }
  }

  protected async sendMessageEmail (user: User): Promise<void> {
    await this.smtp?.send(await this.smtp.create('update_user', {
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
