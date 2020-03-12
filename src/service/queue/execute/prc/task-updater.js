import { SqlBuilder } from '../../../../worker/api.js'

export class TaskUpdater extends SqlBuilder {
  setCodec (value = 'application/json') {
    return super.setCodec(value)
  }

  build (sc) {
    return sc.query(
      sc.update(
        sc.id('app.queue_run_item_task')
      ),
      sc.set(
        sc.eq(
          sc.id('stat_time_updated'),
          sc.value(() => new Date().toISOString())
        ),
        sc.eq(
          sc.id('data_out'),
          (box, data) => {
            if (typeof data.data_out === 'object' && data.data_out !== null) {
              return sc.value(this._codec.stringify(data.data_out))
            }

            return sc.id('data_out')
          }
        ),
        sc.eq(
          sc.id('error'),
          (box, data) => {
            if (data.error instanceof Error) {
              return sc.value(this._codec.stringify(data.error))
            }

            return sc.id('error')
          }
        ),
        sc.eq(
          sc.id('status'),
          (box, data) => {
            if (typeof data.status === 'string') {
              return sc.value(data.status)
            }

            return sc.id('status')
          }
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
    if (data.status === 'PENDING') {
      data.status = data.error instanceof Error
        ? 'FAILURE'
        : 'SUCCESS'
    }

    return data.status === 'FAILURE' ||
      data.status === 'SUCCESS'
  }
}
