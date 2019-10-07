import { Data } from './data'

export class Sum extends Data {
  prepareValue (result, datum) {
    const exogenous = this._exogenous(datum)
    const endogenous = this._endogenous(datum)

    if (result.data[exogenous] === undefined) {
      result.data[exogenous] = []
      result.keys.push(exogenous)
      result.type = 'sum'
    }

    const set = result.data[exogenous]
    const index = set.length

    const previous = index > 0
      ? set[index - 1]
      : [0, 0]

    set[0] = [
      0,
      previous[1] + endogenous,
      datum
    ]

    result.size = set.length
  }
}
