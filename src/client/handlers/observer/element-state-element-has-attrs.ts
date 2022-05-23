import { cast, flatten, isNil, toJoint } from '../../../common'
import type { ScolaElement } from '../../elements/element'
import type { Struct } from '../../../common'

export function elementStateElementHasAttrs (observer: ScolaElement, observable: ScolaElement, query: Struct): void {
  observer.observer.toggleState(Object
    .entries(flatten({
      ...query,
      ...observer.dataset
    }))
    .every(([name, value]) => {
      const observeValue = observable.getAttribute(toJoint(name, {
        separator: '-'
      }))

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
