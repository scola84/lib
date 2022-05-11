import type { User, View, ViewGroup, ViewUser } from '../../../../../common'
import { AuthHandler } from '../../auth'
import type { RouteData } from '../../../../helpers'
import { Struct } from '../../../../../common'
import { sql } from '../../../../helpers'

export class AuthUserGetSessionHandler extends AuthHandler {
  public authenticate = true

  public async handle (data: RouteData): Promise<User> {
    const user = await this.database.selectOne<User, User>(sql`
      SELECT
        $[name],
        $[preferences],
        $[user_id]
      FROM $[user]
      WHERE $[user_id] = $(user_id)
    `, {
      user_id: data.user?.user_id
    })

    const views = await this.database.selectAll<View & ViewGroup & ViewUser, Pick<View, 'name'> & Pick<ViewGroup, 'default_for'> & Pick<ViewUser, 'default_for'>>(sql`
      SELECT
        $[view.name],
        $[view_group.default_for]
      FROM $[view]
      JOIN $[view_group] USING ($[view_id])
      WHERE
        $[view_group.default_for] IS NOT NULL AND
        $[view_group.group_id] = $(group_id)
      UNION
      SELECT
        $[view.name],
        $[view_user.default_for]
      FROM $[view]
      JOIN $[view_user] USING ($[view_id])
      WHERE
        $[view_user.default_for] IS NOT NULL AND
        $[view_user.user_id] = $(user_id)
    `, {
      group_id: user.group_id ?? 0,
      user_id: user.user_id
    })

    user.views = views.reduce<Struct>((result, view) => {
      result[view.default_for ?? ''] = view.name
      return result
    }, Struct.create())

    return user
  }
}
