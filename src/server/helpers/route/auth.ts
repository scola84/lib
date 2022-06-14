import type { Struct, User } from '../../../common'
import type { RedisClientType } from '@redis/client'
import type { RouteData } from '.'
import { ScolaError } from '../../../common'
import type { SqlDatabase } from '../sql'

export interface RouteAuthOptions {
  database: SqlDatabase
  store: RedisClientType
}

export class RouteAuth {
  public database: SqlDatabase

  public store: RedisClientType

  public constructor (options: RouteAuthOptions) {
    this.database = options.database
    this.store = options.store
  }

  public async authenticate (data: RouteData): Promise<User> {
    const hash = data.cookies.authenticate

    if (typeof hash !== 'string') {
      throw new ScolaError({
        code: 'err_authenticates',
        message: 'Hash is undefined',
        status: 401
      })
    }

    const user = await this.store.get(`sc-auth-authenticate-${hash}`)
  }

  public async authorize (data: RouteData, permit?: Struct): Promise<void> {
    if (data.user === undefined) {
      throw new ScolaError({
        code: 'err_authorize',
        message: 'User is undefined',
        status: 401
      })
    }

    if (
      data.user.state_active === false &&
      permit?.inactive === false
    ) {
      throw new ScolaError({
        code: 'err_authorize',
        message: 'User is not active',
        status: 403
      })
    }

    if (
      data.user.state_compromised === true &&
      permit?.compromised === false
    ) {
      throw new ScolaError({
        code: 'err_authorize',
        message: 'User is compromised',
        status: 403
      })
    }

    const name = `${data.method.toUpperCase()} ${data.url.pathname.toLowerCase()}`

    if (
      data.user.role?.permissions[name] !== true &&
      data.user.token?.permissions?.[name] !== true
    ) {
      throw new ScolaError({
        code: 'err_authorize',
        message: 'User is not permitted',
        status: 403
      })
    }

    return Promise.resolve()
  }

  public async elevate (data: RouteData): Promise<void> {
    const hash = data.cookies.elevate

    if (typeof hash !== 'string') {
      throw new ScolaError({
        code: 'err_elevate',
        message: 'Hash is undefined',
        status: 401
      })
    }

    const token = await this.store.get(`sc-auth-elevate-${hash}`)

    if (token === null) {
      throw new ScolaError({
        code: 'err_elevate',
        message: 'Token is null',
        status: 401
      })
    }
  }
}
