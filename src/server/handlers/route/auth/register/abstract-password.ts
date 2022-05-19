import type { Group, Role, User, UserGroup, UserRole } from '../../../../../common'
import { AuthRegisterHandler } from './abstract-register'
import type { RouteData } from '../../../../helpers'
import type { ServerResponse } from 'http'
import { sql } from '../../../../helpers'
import { toString } from '../../../../../common'

export abstract class AuthRegisterPasswordHandler extends AuthRegisterHandler {
  protected async insertUser (user: User): Promise<Pick<User, 'user_id'>> {
    return this.database.insert<User, Pick<User, 'user_id'>>(sql`
      INSERT INTO $[user] (
        $[auth_password],
        $[email_auth_login],
        $[email_auth_update],
        $[i18n_locale],
        $[i18n_time_zone],
        $[identity_email],
        $[identity_name],
        $[identity_tel_country_code],
        $[identity_tel_national],
        $[identity_username]
      ) VALUES (
        $(auth_password),
        $(email_auth_login),
        $(email_auth_update),
        $(i18n_locale),
        $(i18n_time_zone),
        $(identity_email),
        $(identity_name),
        $(identity_tel_country_code),
        $(identity_tel_national),
        $(identity_username)
      )
    `, {
      auth_password: user.auth_password,
      email_auth_login: user.email_auth_login,
      email_auth_update: user.email_auth_update,
      i18n_locale: user.i18n_locale,
      i18n_time_zone: user.i18n_time_zone,
      identity_email: user.identity_email,
      identity_name: user.identity_name,
      identity_tel_country_code: user.identity_tel_country_code,
      identity_tel_national: user.identity_tel_national,
      identity_username: user.identity_username
    }, 'user_id')
  }

  protected async insertUserGroup (userGroup: UserGroup): Promise<void> {
    await this.database.insert<UserGroup>(sql`
      INSERT INTO $[user_group] (
        $[group_id],
        $[user_id]
      ) VALUES (
        $(group_id),
        $(user_id)
      )
    `, {
      group_id: userGroup.group_id,
      user_id: userGroup.user_id
    }, null)
  }

  protected async insertUserRole (userRole: UserRole): Promise<void> {
    await this.database.insert<UserRole>(sql`
      INSERT INTO $[user_role] (
        $[role_id],
        $[user_id]
      ) VALUES (
        $(role_id),
        $(user_id)
      )
    `, {
      role_id: userRole.role_id,
      user_id: userRole.user_id
    }, null)
  }

  protected async register (data: RouteData, response: ServerResponse, user: User): Promise<void> {
    user.user_id = (await this.insertUser(user)).user_id

    const [
      group,
      role
    ] = await Promise.all([
      this.selectGroupForRegister(),
      this.selectRoleForRegister()
    ])

    if (group !== undefined) {
      user.group = group

      await this.insertUserGroup({
        group_id: group.group_id,
        user_id: user.user_id
      })
    }

    if (role !== undefined) {
      user.role = role

      await this.insertUserRole({
        role_id: role.role_id,
        user_id: user.user_id
      })
    }

    await this.auth.login(response, user)

    Promise
      .resolve()
      .then(async () => {
        await this.auth.clearBackoff(data)
        await this.sendMessage(user)
      })
      .catch((error) => {
        this.logger?.error({
          context: 'register'
        }, toString(error))
      })
  }

  protected async selectGroupForRegister (): Promise<Group | undefined> {
    return this.database.select<Group, Group>(sql`
      SELECT $[group].*
      FROM $[group]
      WHERE $[for_register] = $(for_register)
    `, {
      for_register: true
    })
  }

  protected async selectRoleForRegister (): Promise<Role | undefined> {
    return this.database.select<Role, Role>(sql`
      SELECT $[role].*
      FROM $[role]
      WHERE $[for_register] = $(for_register)
    `, {
      for_register: true
    })
  }

  protected async sendMessage (user: User): Promise<void> {
    if (user.identity_email !== null) {
      await this.sendMessageEmail(user)
    } else if (user.identity_tel_national !== null) {
      await this.sendMessageTel(user)
    }
  }

  protected async sendMessageEmail (user: User): Promise<void> {
    await this.smtp?.send(await this.smtp.create('register', {
      date: new Date(),
      date_time_zone: user.i18n_time_zone,
      url: `${this.origin}?next=auth_unregister_identity_request`,
      user: user
    }, {
      i18n_locale: user.i18n_locale,
      identity_email: user.identity_email,
      identity_name: user.identity_name
    }))
  }

  protected async sendMessageTel (user: User): Promise<void> {
    await this.sms?.send(await this.sms.create('register', {
      date: new Date(),
      date_time_zone: user.i18n_time_zone,
      url: `${this.origin}?next=auth_unregister_identity_request`,
      user: user
    }, {
      i18n_locale: user.i18n_locale,
      identity_tel: user.identity_tel
    }))
  }
}
