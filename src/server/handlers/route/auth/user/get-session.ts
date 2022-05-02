import { AuthHandler } from '../../auth'
import type { RouteData } from '../../../../helpers'
import type { User } from '../../../../../common'

export class AuthUserGetSessionHandler extends AuthHandler {
  public authenticate = true

  public handle (data: RouteData): Partial<User> {
    return {
      name: data.user?.name,
      preferences: {
        locale: data.user?.preferences.locale,
        theme: data.user?.preferences.theme
      },
      user_id: data.user?.user_id
    }
  }
}
