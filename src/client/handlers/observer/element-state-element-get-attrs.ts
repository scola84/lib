import { cast, flatten, toJoint } from '../../../common'
import type { ScolaElement } from '../../elements/element'
import type { Struct } from '../../../common'

export function elementStateElementGetAttrs (observer: ScolaElement, observable: ScolaElement, query: Struct): void {
  observer.observer.toggleState(Object
    .entries(flatten({
      ...query,
      ...observer.dataset
    }))
    .every(([name, value]) => {
      const observeValue = cast(observable.getAttribute(toJoint(name, {
        separator: '-'
      })))

      return String(value ?? '')
        .split(',')
        .some((someValue) => {
          return cast(someValue) === observeValue
        })
    }))
}
