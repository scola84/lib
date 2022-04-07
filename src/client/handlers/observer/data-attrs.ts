import { cast, set, toJoint } from '../../../common'
import type { ScolaElement } from '../../elements'

export function dataAttrs (observer: ScolaElement, observable: ScolaElement): void {
  observer.data = Object
    .entries(observer.dataset)
    .reduce((result, [setName, getName = '']) => {
      const value = cast(observable.getAttribute(toJoint(getName, {
        separator: '-'
      })))

      return set(result, setName, value)
    }, {})
}
