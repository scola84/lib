import { CrudHandler } from './crud'
import type { RouteData } from '../../../helpers/route'

export abstract class CrudDeleteAllHandler extends CrudHandler {
  public method = 'POST'

  public async handle (data: RouteData): Promise<void> {
    const deleteAllQuery = this.database.formatter.createDeleteAllQuery(this.object, this.keys, this.keys.primary ?? [], data.user)
    return this.database.delete(deleteAllQuery.string, deleteAllQuery.values)
  }
}
