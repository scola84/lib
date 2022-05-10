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
        $[email],
        $[name],
        $[preferences],
        $[tel_country_code],
        $[tel_national],
        $[username]
      ) VALUES (
        $(auth_password),
        $(email),
        $(name),
        $(preferences),
        $(tel_country_code),
        $(tel_national),
        $(username)
      )
    `, {
      auth_password: user.auth_password,
      email: user.email,
      name: user.name,
      preferences: user.preferences,
      tel_country_code: user.tel_country_code,
      tel_national: user.tel_national,
      username: user.username
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
    if (user.email !== null) {
      await this.sendMessageEmail(user)
    } else if (user.tel_national !== null) {
      await this.sendMessageTel(user)
    }
  }

  protected async sendMessageEmail (user: User): Promise<void> {
    await this.smtp?.send(await this.smtp.create('auth_register', {
      date: new Date(),
      date_time_zone: user.preferences.time_zone,
      url: `${this.origin}?next=auth_unregister_identity_request`,
      user: user
    }, {
      email: user.email,
      name: user.name,
      preferences: user.preferences
    }))
  }

  protected async sendMessageTel (user: User): Promise<void> {
    await this.sms?.send(await this.sms.create('auth_register', {
      date: new Date(),
      date_time_zone: user.preferences.time_zone,
      url: `${this.origin}?next=auth_unregister_identity_request`,
      user: user
    }, {
      preferences: user.preferences,
      tel: user.tel
    }))
  }
}
