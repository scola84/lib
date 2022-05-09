import { cast, get, isNil } from '../../../common'
import type { ScolaElement } from '../../elements/element'
import type { Struct } from '../../../common'

export function elementStateElementHasProps (observer: ScolaElement, observable: ScolaElement, query: Struct): void {
  observer.observer.toggleState(Object
    .entries(query)
    .every(([name, value]) => {
      const observeValue = get(observable, name)
      return String(value ?? '')
        .split(',')
        .some((someValue) => {
          const castValue = cast(someValue)

          if (castValue === true) {
            return !isNil(observeValue)
          }

          return isNil(observeValue)
        })
    }))
}
