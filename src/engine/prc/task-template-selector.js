import luxon from 'luxon'
import { SqlBuilder } from '../../worker/api.js'

export class TaskTemplateSelector extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.select(
        sc.id(
          'settings'
        )
      ),
      sc.from(
        sc.id('app.queue_task_template')
      ),
      sc.where(
        sc.and(
          sc.eq(
            sc.id('id_queue'),
            sc.value((box, data) => data.id_queue)
          ),
          sc.eq(
            sc.id('name'),
            sc.value((box, data) => data.name)
          )
        )
      )
    )
  }

  merge (box, data, { rows: [template = null] }) {
    if (template !== null) {
      this.mergeSettings(data, template)
      this.mergeTimeout(data, template)
    }

    return data
  }

  mergeSettings (data, template) {
    if (template.timeout_after === null) {
      return
    }

    data.settings = JSON.parse(template.settings)
  }

  mergeTimeout (data, template) {
    if (template.timeout_after === null) {
      return
    }

    const [
      unit,
      amount
    ] = template.timeout_after.split(' ')

    const date = luxon.DateTime
      .local()
      .plus({
        [unit]: amount
      })

    data.timeout_time = date.toISO()
  }
}
