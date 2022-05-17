import type { Result, User } from '../../../../../common'
import type { RouteData } from '../../../../helpers'
import { RouteHandler } from '../../../../helpers'
import { toString } from '../../../../../common'

interface AuthUserUpdateHandlerData extends RouteData {
  body: {
    email_auth_login?: boolean
    email_auth_update?: boolean
    i18n_locale?: string
    i18n_time_zone?: string
    identity_email?: string
    identity_name?: string
    identity_tel_country_code?: string
    identity_tel_national?: string
    identity_username?: string
  }
}

export class AuthUserUpdateHandler extends RouteHandler {
  public authorize = false

  public keys = {
    primary: [{
      column: 'user_id',
      table: 'user'
    }]
  }

  public method = 'POST'

  public schema = {
    body: {
      custom: 'identity',
      required: true,
      schema: {
        email_auth_login: {
          type: 'boolean'
        },
        email_auth_update: {
          type: 'boolean'
        },
        i18n_locale: {
          generator: 'sc-locale',
          type: 'select'
        },
        i18n_time_zone: {
          generator: 'sc-time-zone',
          type: 'select'
        },
        identity_email: {
          type: 'email'
        },
        identity_name: {
          type: 'text'
        },
        identity_tel_country_code: {
          generator: 'sc-tel-country-code',
          type: 'select'
        },
        identity_tel_national: {
          custom: 'tel-national',
          type: 'tel'
        },
        identity_username: {
          type: 'text'
        }
      },
      type: 'fieldset'
    }
  }

  public async handle (data: AuthUserUpdateHandlerData): Promise<Result> {
    const updateQuery = this.database?.formatter.createUpdateQuery('user', this.schema.body.schema, this.keys, data.body)

    if (updateQuery?.values !== undefined) {
      updateQuery.values.user_id = data.user?.user_id
      await this.database?.update(updateQuery.string, updateQuery.values)
    }

    if (data.user !== undefined) {
      this
        .sendMessage(data.user)
        .catch((error) => {
          this.logger?.error({
            context: 'update'
          }, toString(error))
        })
    }

    return {
      code: 'ok_update_user'
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
      url: `${this.origin}?next=auth_reset`,
      user: user
    }, {
      i18n_locale: user.i18n_locale,
      identity_email: user.identity_email,
      identity_name: user.identity_name
    }))
  }
}
