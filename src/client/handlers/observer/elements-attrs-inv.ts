import { cast, toJoint } from '../../../common'
import type { ScolaElement } from '../../elements/element'

export function elementsAttrsInv (observer: ScolaElement, observable: ScolaElement): void {
  observer.observer.toggle(!Object
    .entries(observer.dataset)
    .every(([name, value]) => {
      return value
        ?.split(' ')
        .some((someValue) => {
          const castValue = cast(someValue)
          const observeValue = observable.getAttribute(toJoint(name, '-'))

          if (castValue === true) {
            return observeValue !== null
          } else if (castValue === false) {
            return observeValue === null
          }

          return someValue === observeValue
        })
    }))
}
