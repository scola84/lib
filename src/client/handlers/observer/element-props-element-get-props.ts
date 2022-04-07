import { get, set } from '../../../common'
import type { ScolaElement } from '../../elements'

export function elementPropsElementGetProps (observer: ScolaElement, observable: ScolaElement): void {
  window.requestAnimationFrame(() => {
    Object
      .entries(observer.dataset)
      .forEach(([setName, getName = '']) => {
        set(observer, setName, get(observable, getName))
      })
  })
}
