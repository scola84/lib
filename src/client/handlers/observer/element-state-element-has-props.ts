import { cast, get, isNil } from '../../../common'
import type { ScolaElement } from '../../elements/element'

export function elementStateElementHasProps (observer: ScolaElement, observable: ScolaElement): void {
  observer.observer.toggleState(Object
    .entries(observer.dataset)
    .every(([name, value]) => {
      const observeValue = get(observable, name)

      return value
        ?.split(/\s+/u)
        .some((someValue) => {
          const castValue = cast(someValue)

          if (castValue === true) {
            return !isNil(observeValue)
          }

          return isNil(observeValue)
        })
    }))
}
