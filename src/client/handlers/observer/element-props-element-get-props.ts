import { get, set } from '../../../common'
import type { ScolaElement } from '../../elements'
import type { Struct } from '../../../common'

export function elementPropsElementGetProps (observer: ScolaElement, observable: ScolaElement, query: Struct): void {
  window.requestAnimationFrame(() => {
    Object
      .entries({
        ...query,
        ...observer.dataset
      })
      .forEach(([setName, getName = '']) => {
        set(observer, setName, get(observable, String(getName)))
      })
  })
}
