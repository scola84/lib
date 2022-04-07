import { cast, set, toJoint } from '../../../common'
import type { ScolaElement } from '../../elements'

export function elementPropsElementGetAttrs (observer: ScolaElement, observable: ScolaElement): void {
  Object
    .entries(observer.dataset)
    .forEach(([setName, getName = '']) => {
      return set(observer, setName, cast(observable.getAttribute(toJoint(getName, {
        separator: '-'
      }))))
    })
}
