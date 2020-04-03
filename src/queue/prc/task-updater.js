import isError from 'lodash/isError.js'
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
          sc.id('error'),
          (box, data) => {
            if (isError(data.out.error) === true) {
              return sc.value(this.transformError(data.out.error))
            }

            return sc.id('error')
          }
        ),
        sc.eq(
          sc.id('status'),
          sc.value((box, data) => {
            return isError(data.out.error) === true
              ? 'FAILURE'
              : 'SUCCESS'
          })
        )
      ),
      sc.where(
        sc.and(
          sc.eq(
            sc.id('id_task'),
            sc.value((box, data) => data.out.id_task)
          ),
          sc.eq(
            sc.id('status'),
            sc.value('PENDING')
          )
        )
      )
    )
  }

  decide (box, data, error) {
    if (isError(error) === true) {
      data.out.error = error
      data.out.final = true
    }

    return true
  }

  filter (box, data) {
    if (isError(data.out.error) === true) {
      data.out.final = true
    }

    return data
  }
}
