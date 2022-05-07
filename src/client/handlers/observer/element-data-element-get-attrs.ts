import { cast, set } from '../../../common'
import type { ScolaElement } from '../../elements'
import type { Struct } from '../../../common'

export function elementDataElementGetAttrs (observer: ScolaElement, observable: ScolaElement, query: Struct): void {
  observer.data = Object
    .entries(query)
    .reduce((result, [setName, getName = '']) => {
      return set(result, setName, cast(observable.getAttribute(String(getName))))
    }, {})
}
