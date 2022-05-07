import type { RouteAuth, RouteData, RouteHandlerOptions } from '../../../helpers/route'
import type { User, UserToken } from '../../../../common'
import type { RedisClientType } from 'redis'
import { RouteHandler } from '../../../helpers/route'
import type { ServerResponse } from 'http'
import type { SqlDatabase } from '../../../helpers/sql'
import { sql } from '../../../helpers/sql'

export abstract class AuthHandler extends RouteHandler {
  public auth: RouteAuth

  public authenticate = false

  public authorize = false

  public database: SqlDatabase

  public store: RedisClientType

  public constructor (options?: Partial<RouteHandlerOptions>) {
    const handlerOptions = {
      ...RouteHandler.options,
      ...options
    }

    if (handlerOptions.auth === undefined) {
      throw new Error('Option "auth" is undefined')
    }

    if (handlerOptions.database === undefined) {
      throw new Error('Option "database" is undefined')
    }

    if (handlerOptions.store === undefined) {
      throw new Error('Option "store" is undefined')
    }

    super(handlerOptions)
  }

  protected async getTmpUser (data: RouteData, response: ServerResponse): Promise<User> {
    const hash = this.auth.getHash(data)

    if (hash === undefined) {
      response.statusCode = 401
      throw new Error('Hash is undefined')
    }

    const tmpUser = await this.getTmpUserByHash(hash)

    if (tmpUser === undefined) {
      response.statusCode = 401
      throw new Error('Tmp user is undefined')
    }

    return tmpUser
  }

  protected async getTmpUserByHash (hash: string): Promise<User | undefined> {
    const tmpUser = await this.store.getDel(`sc-auth-tmp-user-${hash}`)

    if (tmpUser === null) {
      return undefined
    }

    return JSON.parse(tmpUser) as User
  }

  protected async setTmpUser (user: User, token: UserToken): Promise<void> {
    await this.store.set(`sc-auth-tmp-user-${token.hash}`, JSON.stringify(user), {
      PXAT: token.date_expires.valueOf()
    })
  }

  protected async updateUserCodes (user: Pick<User, 'auth_codes_confirmed' | 'auth_codes' | 'user_id'>): Promise<void> {
    await this.database.update<User>(sql`
      UPDATE $[user]
      SET 
        $[auth_codes] = $(auth_codes),
        $[auth_codes_confirmed] = $(auth_codes_confirmed)
      WHERE $[user_id] = $(user_id)
    `, {
      auth_codes: user.auth_codes,
      auth_codes_confirmed: user.auth_codes_confirmed,
      user_id: user.user_id
    })
  }

  protected async updateUserHotp (user: User): Promise<void> {
    if (user.auth_hotp_email_confirmed !== null) {
      await this.updateUserHotpEmail({
        auth_hotp_email: user.auth_hotp_email,
        auth_hotp_email_confirmed: user.auth_hotp_email_confirmed,
        user_id: user.user_id
      })
    } else if (user.auth_hotp_tel_confirmed !== null) {
      await this.updateUserHotpTel({
        auth_hotp_tel_confirmed: user.auth_hotp_tel_confirmed,
        auth_hotp_tel_country_code: user.auth_hotp_tel_country_code,
        auth_hotp_tel_national: user.auth_hotp_tel_national,
        user_id: user.user_id
      })
    }
  }

  protected async updateUserHotpEmail (user: Pick<User, 'auth_hotp_email_confirmed' | 'auth_hotp_email' | 'user_id'>): Promise<void> {
    await this.database.update<User>(sql`
      UPDATE $[user]
      SET
        $[auth_hotp_email] = $(auth_hotp_email),
        $[auth_hotp_email_confirmed] = $(auth_hotp_email_confirmed)
      WHERE $[user_id] = $(user_id)
    `, {
      auth_hotp_email: user.auth_hotp_email,
      auth_hotp_email_confirmed: user.auth_hotp_email_confirmed,
      user_id: user.user_id
    })
  }

  protected async updateUserHotpTel (user: Pick<User, 'auth_hotp_tel_confirmed' | 'auth_hotp_tel_country_code' | 'auth_hotp_tel_national' | 'user_id'>): Promise<void> {
    await this.database.update<User>(sql`
      UPDATE $[user]
      SET
        $[auth_hotp_tel_confirmed] = $(auth_hotp_tel_confirmed),
        $[auth_hotp_tel_country_code] = $(auth_hotp_tel_country_code),
        $[auth_hotp_tel_national] = $(auth_hotp_tel_national)
      WHERE $[user_id] = $(user_id)
    `, {
      auth_hotp_tel_confirmed: user.auth_hotp_tel_confirmed,
      auth_hotp_tel_country_code: user.auth_hotp_tel_country_code,
      auth_hotp_tel_national: user.auth_hotp_tel_national,
      user_id: user.user_id
    })
  }

  protected async updateUserPassword (user: Pick<User, 'auth_password' | 'user_id'>): Promise<void> {
    await this.database.update<User>(sql`
      UPDATE $[user]
      SET $[auth_password] = $(auth_password)
      WHERE $[user_id] = $(user_id)
    `, {
      auth_password: user.auth_password,
      user_id: user.user_id
    })
  }

  protected async updateUserTotp (user: Pick<User, 'auth_totp_confirmed' | 'auth_totp' | 'user_id'>): Promise<void> {
    await this.database.update<User>(sql`
      UPDATE $[user]
      SET
        $[auth_totp] = $(auth_totp),
        $[auth_totp_confirmed] = $(auth_totp_confirmed)
      WHERE $[user_id] = $(user_id)
    `, {
      auth_totp: user.auth_totp,
      auth_totp_confirmed: user.auth_totp_confirmed,
      user_id: user.user_id
    })
  }
}
