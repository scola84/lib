import { cast, set, toJoint } from '../../../common'
import type { ScolaElement } from '../../elements'
import type { Struct } from '../../../common'

export function elementPropsElementGetAttrs (observer: ScolaElement, observable: ScolaElement, query: Struct): void {
  Object
    .entries({
      ...query,
      ...observer.dataset
    })
    .forEach(([setName, getName = '']) => {
      return set(observer, setName, cast(observable.getAttribute(toJoint(String(getName), {
        separator: '-'
      }))))
    })
}
