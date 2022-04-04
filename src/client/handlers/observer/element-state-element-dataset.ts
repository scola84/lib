import { cast, isNil } from '../../../common'
import type { ScolaElement } from '../../elements/element'

export function elementStateElementDataset (observer: ScolaElement, observable: ScolaElement): void {
  window.requestAnimationFrame(() => {
    observer.observer.toggleState(Object
      .entries(observer.dataset)
      .every(([name, value]) => {
        return value
          ?.split(/\s+/u)
          .some((someValue) => {
            const castValue = cast(someValue)
            const observeValue = cast(observable.dataset[name])

            if (castValue === true) {
              return !isNil(observeValue)
            } else if (castValue === false) {
              return isNil(observeValue)
            }

            return someValue === observeValue
          })
      }))
  })
}
