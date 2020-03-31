import isError from 'lodash/isError.js'
import isPlainObject from 'lodash/isPlainObject.js'
import { SqlBuilder } from '../../actor/api.js'

export class TaskUpdater extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.update(
        sc.id('app.queue_task')
      ),
      sc.set(
        sc.eq(
          sc.id('stat_time_task_updated'),
          sc.now()
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
            if (isError(data.error) === true) {
              return sc.value(this.transformError(data.error))
            }

            return sc.id('error')
          }
        ),
        sc.eq(
          sc.id('status'),
          sc.value((box, data) => {
            if (data.status === 'FAILURE') {
              return data.status
            }

            return 'SUCCESS'
          })
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

  filter (box, data) {
    if (isError(data.error) === true) {
      data.status = 'FAILURE'
    }

    return data
  }
}
