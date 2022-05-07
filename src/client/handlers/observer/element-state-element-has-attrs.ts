import { cast, isNil } from '../../../common'
import type { ScolaElement } from '../../elements/element'
import type { Struct } from '../../../common'

export function elementStateElementHasAttrs (observer: ScolaElement, observable: ScolaElement, query: Struct): void {
  observer.observer.toggleState(Object
    .entries(query)
    .every(([name, value]) => {
      const observeValue = observable.getAttribute(name)
      return String(value ?? '')
        .split(/\s+/u)
        .some((someValue) => {
          const castValue = cast(someValue)

          if (castValue === true) {
            return !isNil(observeValue)
          }

          return isNil(observeValue)
        })
    }))
}
