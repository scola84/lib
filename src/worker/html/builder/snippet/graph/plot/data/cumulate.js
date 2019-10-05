import { Data } from './data'

export class Cumulate extends Data {
  prepareValue (result, datum) {
    const exogenous = this._exogenous(datum)
    const endogenous = this._endogenous(datum)

    if (result.data[exogenous] === undefined) {
      result.data[exogenous] = []
      result.keys[result.keys.length] = exogenous
      result.type = 'cumulate'
    }

    const set = result.data[exogenous]
    const index = set.length
    const previousKey = result.keys[result.keys.length - 2]
    const previous = previousKey !== undefined
      ? result.data[previousKey][index] : [0, 0]

    set[index] = [
      0,
      previous[1] + endogenous,
      datum
    ]

    result.size = set.length
  }
}
