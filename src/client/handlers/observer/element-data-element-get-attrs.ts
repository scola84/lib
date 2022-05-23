import { cast, flatten, set, toJoint } from '../../../common'
import type { ScolaElement } from '../../elements'
import type { Struct } from '../../../common'

export function elementDataElementGetAttrs (observer: ScolaElement, observable: ScolaElement, query: Struct): void {
  observer.data = Object
    .entries(flatten({
      ...query,
      ...observer.dataset
    }))
    .reduce((result, [setName, getName = '']) => {
      return set(result, setName, cast(observable.getAttribute(toJoint(String(getName), {
        separator: '-'
      }))))
    }, {})
}
