import { cast, set } from '../../../common'
import type { ScolaElement } from '../../elements'
import type { Struct } from '../../../common'

export function elementPropsElementGetAttrs (observer: ScolaElement, observable: ScolaElement, query: Struct): void {
  Object
    .entries(query)
    .forEach(([setName, getName = '']) => {
      return set(observer, setName, cast(observable.getAttribute(String(getName))))
    })
}
