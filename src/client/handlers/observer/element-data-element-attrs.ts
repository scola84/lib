import { set, toJoint } from '../../../common'
import type { ScolaElement } from '../../elements/element'
import type { ScolaFieldElement } from '../../elements/field'

export function elementDataElementAttrs (observer: ScolaFieldElement, observable: ScolaElement): void {
  observer.data = Object
    .entries(observer.dataset)
    .reduce((result, [setName, getName = '']) => {
      return set(result, toJoint(setName, { separator: '.' }), observable.getAttribute(getName))
    }, {})
}
