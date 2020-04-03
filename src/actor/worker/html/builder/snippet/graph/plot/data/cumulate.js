import isUndefined from 'lodash/isUndefined.js'
import { Data } from './data.js'

export class Cumulate extends Data {
  prepareValue (result, datum) {
    const exogenous = this._exogenous(datum)
    const endogenous = this._endogenous(datum)

    if (isUndefined(result.data[exogenous]) === true) {
      result.data[exogenous] = []
      result.keys.push(exogenous)
      result.type = 'cumulate'
    }

    const set = result.data[exogenous]
    const index = set.length
    const previousKey = result.keys[result.keys.length - 2]

    const previous = isUndefined(previousKey) === true
      ? [0, 0]
      : result.data[previousKey][index]

    set[index] = [
      0,
      previous[1] + endogenous,
      datum
    ]

    result.size = set.length
  }
}
