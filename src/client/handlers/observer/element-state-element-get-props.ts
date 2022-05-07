import { cast, get } from '../../../common'
import type { ScolaElement } from '../../elements/element'
import type { Struct } from '../../../common'

export function elementStateElementGetProps (observer: ScolaElement, observable: ScolaElement, query: Struct): void {
  observer.observer.toggleState(Object
    .entries(query)
    .every(([name, value]) => {
      const observeValue = get(observable, name)
      return String(value ?? '')
        .split(/\s+/u)
        .some((someValue) => {
          return cast(someValue) === observeValue
        })
    }))
}
