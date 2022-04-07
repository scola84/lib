import { cast, toJoint } from '../../../common'
import type { ScolaElement } from '../../elements/element'

export function elementStateElementGetAttrs (observer: ScolaElement, observable: ScolaElement): void {
  observer.observer.toggleState(Object
    .entries(observer.dataset)
    .every(([name, value]) => {
      const observeValue = observable.getAttribute(toJoint(name, {
        separator: '-'
      }))

      return value
        ?.split(/\s+/u)
        .some((someValue) => {
          return cast(someValue) === observeValue
        })
    }))
}
