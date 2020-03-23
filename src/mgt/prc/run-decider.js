import camelCase from 'lodash/camelCase.js'
import isPlainObject from 'lodash/isPlainObject.js'
import upperFirst from 'lodash/upperFirst.js'
import { Worker } from '../../ops/api.js'

export class RunDecider extends Worker {
  decide (box, data) {
    if (isPlainObject(data.previous) === true) {
      return this.decideCondition(data.queue.previous_condition, data)
    }

    return this.decideCondition(data.queue.trigger_condition, data)
  }

  decideCondition (condition, data) {
    if (condition === null) {
      return true
    }

    return condition.split(',').every((value) => {
      return this[`decide${upperFirst(camelCase())}`](data)
    })
  }

  decideHasNoFailure (data) {
    return data.queue.stat_count_item_failure === 0
  }

  decideHasNoTimeout (data) {
    return data.queue.stat_count_item_timeout === 0
  }

  decideIsNotBusy (data) {
    return data.queue.stat_count_run_busy === 0
  }
}
