import { Data } from './data'

export class Default extends Data {
  prepareValue (result, datum) {
    const exogenous = this._exogenous(datum)
    const endogenous = this._endogenous(datum)

    if (result.data[exogenous] === undefined) {
      result.data[exogenous] = []
      result.keys.push(exogenous)
      result.type = 'default'
    }

    const set = result.data[exogenous]
    const index = set.length

    set[index] = [
      0,
      endogenous,
      datum
    ]

    result.size = set.length
  }
}
