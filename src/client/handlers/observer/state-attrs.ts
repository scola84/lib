import { cast, toJoint } from '../../../common'
import type { ScolaElement } from '../../elements/element'

export function stateAttrs (observer: ScolaElement, observable: ScolaElement): void {
  observer.observer.toggleState(Object
    .entries(observer.dataset)
    .every(([name, value]) => {
      const observeValue = observable.getAttribute(toJoint(name, {
        separator: '-'
      }))

      return value
        ?.split(/\s+/u)
        .some((someValue) => {
          const castValue = cast(someValue)

          if (castValue === true) {
            return observeValue !== null
          } else if (castValue === false) {
            return observeValue === null
          }

          return someValue === observeValue
        })
    }))
}
