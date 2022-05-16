import type { Result, Struct } from '../../../../../common'
import type { RouteData } from '../../../../helpers'
import { RouteHandler } from '../../../../helpers'

interface AuthUserUpdateHandlerData extends RouteData {
  body: {
    auth_password: string
    email?: string
    name?: string
    preferences: Struct
    tel_country_code?: string
    tel_national?: string
    username?: string
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
        auth_password: {
          type: 'password'
        },
        email: {
          type: 'email'
        },
        name: {
          type: 'text'
        },
        preferences: {
          schema: {
            locale: {
              generator: 'sc-locale',
              type: 'select'
            },
            theme: {
              generator: 'sc-theme',
              type: 'select'
            },
            time_zone: {
              generator: 'sc-time-zone',
              type: 'select'
            }
          },
          type: 'fieldset'
        },
        tel_country_code: {
          generator: 'sc-tel-country-code',
          type: 'select'
        },
        tel_national: {
          custom: 'tel-national',
          type: 'tel'
        },
        username: {
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

    return {
      code: 'ok_auth_update_user'
    }
  }
}
