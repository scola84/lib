import { cast, hyphenize } from '../../../common'
import type { ScolaElement } from '../../elements/element'

export function elementsAttrs (observer: ScolaElement, observable: ScolaElement): void {
  observer.observer.toggle(Object
    .entries(observer.dataset)
    .every(([name, value]) => {
      return value
        ?.split(' ')
        .some((someValue) => {
          const castValue = cast(someValue)
          const observeValue = observable.getAttribute(hyphenize(name))

          if (castValue === true) {
            return observeValue !== null
          } else if (castValue === false) {
            return observeValue === null
          }

          return someValue === observeValue
        })
    }))
}
