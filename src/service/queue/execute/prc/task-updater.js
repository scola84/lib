import { SqlBuilder } from '../../../../worker/api.js'

export class TaskUpdater extends SqlBuilder {
  setCodec (value = 'application/json') {
    return super.setCodec(value)
  }

  build (sb) {
    return sb.query(
      sb.update(
        sb.id('app.queue_run_item_task')
      ),
      sb.set(
        sb.eq(
          sb.id('stat_time_updated'),
          sb.value(() => new Date().toISOString())
        ),
        sb.eq(
          sb.id('data_out'),
          (box, data) => {
            if (typeof data.data_out === 'object' && data.data_out !== null) {
              return sb.value(this._codec.stringify(data.data_out))
            }

            return sb.id('data_out')
          }
        ),
        sb.eq(
          sb.id('error'),
          (box, data) => {
            if (data.error instanceof Error) {
              return sb.value(this._codec.stringify(data.error))
            }

            return sb.id('error')
          }
        ),
        sb.eq(
          sb.id('status'),
          (box, data) => {
            if (typeof data.status === 'string') {
              return sb.value(data.status)
            }

            return sb.id('status')
          }
        )
      ),
      sb.where(
        sb.and(
          sb.eq(
            sb.id('id_task'),
            sb.value((box, data) => data.id_task)
          ),
          sb.eq(
            sb.id('status'),
            sb.value('PENDING')
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
