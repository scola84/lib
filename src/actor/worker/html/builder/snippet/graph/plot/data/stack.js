import isUndefined from 'lodash/isUndefined.js'
import { Data } from './data.js'

export class Stack extends Data {
  prepareValue (result, datum) {
    const exogenous = this._exogenous(datum)
    const endogenous = this._endogenous(datum)

    if (isUndefined(result.data[exogenous]) === true) {
      result.data[exogenous] = []
      result.keys.push(exogenous)
      result.type = 'stack'
    }

    const set = result.data[exogenous]
    const index = set.length

    const previous = index > 0
      ? set[index - 1]
      : [0, 0]

    set[index] = [
      previous[1],
      previous[1] + endogenous,
      datum
    ]

    result.size = set.length
  }
}
