import isPlainObject from 'lodash/isPlainObject.js'
import { SqlBuilder } from '../../worker/api.js'

export class TaskUpdater extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.update(
        sc.id('app.queue_task')
      ),
      sc.set(
        sc.eq(
          sc.id('stat_time_task_updated'),
          sc.value(() => this.date().toISO())
        ),
        sc.eq(
          sc.id('data_out'),
          (box, data) => {
            if (isPlainObject(data.data_out) === true) {
              return sc.value(data.data_out)
            }

            return sc.id('data_out')
          }
        ),
        sc.eq(
          sc.id('error'),
          (box, data) => {
            if ((data.error instanceof Error) === true) {
              return sc.value(this.error(data.error))
            }

            return sc.id('error')
          }
        ),
        sc.eq(
          sc.id('status'),
          sc.value((box, data) => data.status)
        )
      ),
      sc.where(
        sc.and(
          sc.eq(
            sc.id('id_task'),
            sc.value((box, data) => data.id_task)
          ),
          sc.eq(
            sc.id('status'),
            sc.value('PENDING')
          )
        )
      )
    )
  }

  decide (box, data) {
    data.status = (data.error instanceof Error) === true
      ? 'FAILURE'
      : 'SUCCESS'

    return true
  }
}
