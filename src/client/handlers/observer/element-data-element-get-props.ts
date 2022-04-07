import { get, set } from '../../../common'
import type { ScolaElement } from '../../elements'

export function elementDataElementGetProps (observer: ScolaElement, observable: ScolaElement): void {
  observer.data = Object
    .entries(observer.dataset)
    .reduce((result, [setName, getName = '']) => {
      return set(result, setName, get(observable, getName))
    }, {})
}
