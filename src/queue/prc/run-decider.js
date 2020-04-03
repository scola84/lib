import camelCase from 'lodash/camelCase.js'
import isError from 'lodash/isError.js'
import isPlainObject from 'lodash/isPlainObject.js'
import isString from 'lodash/isString.js'
import upperFirst from 'lodash/upperFirst.js'
import { Worker } from '../../actor/api.js'

export class RunDecider extends Worker {
  decide (box, data, error) {
    if (isError(error) === true) {
      return false
    }

    if (isPlainObject(data.previous) === true) {
      return this.decideCondition(data, data.queue.previous_condition)
    }

    return this.decideCondition(data, data.queue.trigger_condition)
  }

  decideCondition (data, condition) {
    if (isString(condition) === false) {
      return true
    }

    return condition.split(',').every((value) => {
      return this[`decide${upperFirst(camelCase(value))}`](data)
    })
  }

  decideHasFailure (data) {
    return data.queue.stat_count_item_failure > 0
  }

  decideHasNoFailure (data) {
    return data.queue.stat_count_item_failure === 0
  }

  decideHasTimeout (data) {
    return data.queue.stat_count_item_timeout > 0
  }

  decideHasNoTimeout (data) {
    return data.queue.stat_count_item_timeout === 0
  }

  decideIsNotBusy (data) {
    return data.queue.stat_count_run_busy === 0
  }
}
