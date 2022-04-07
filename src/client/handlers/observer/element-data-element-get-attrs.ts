import { cast, set, toJoint } from '../../../common'
import type { ScolaElement } from '../../elements'

export function elementDataElementGetAttrs (observer: ScolaElement, observable: ScolaElement): void {
  observer.data = Object
    .entries(observer.dataset)
    .reduce((result, [setName, getName = '']) => {
      return set(result, setName, cast(observable.getAttribute(toJoint(getName, {
        separator: '-'
      }))))
    }, {})
}
