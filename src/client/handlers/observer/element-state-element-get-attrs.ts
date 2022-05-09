import type { ScolaElement } from '../../elements/element'
import type { Struct } from '../../../common'
import { cast } from '../../../common'

export function elementStateElementGetAttrs (observer: ScolaElement, observable: ScolaElement, query: Struct): void {
  observer.observer.toggleState(Object
    .entries(query)
    .every(([name, value]) => {
      const observeValue = cast(observable.getAttribute(name))
      return String(value ?? '')
        .split(',')
        .some((someValue) => {
          return cast(someValue) === observeValue
        })
    }))
}
