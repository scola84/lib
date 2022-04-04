import { cast, toJoint } from '../../../common'
import type { ScolaElement } from '../../elements/element'

export function elementStateElementAttrs (observer: ScolaElement, observable: ScolaElement): void {
  observer.observer.toggleState(Object
    .entries(observer.dataset)
    .every(([name, value]) => {
      return value
        ?.split(/\s+/u)
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
