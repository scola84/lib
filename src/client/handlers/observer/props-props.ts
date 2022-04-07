import { cast, get, set } from '../../../common'
import type { ScolaElement } from '../../elements'

export function propsProps (observer: ScolaElement, observable: ScolaElement): void {
  Object
    .entries(observer.dataset)
    .forEach(([setName, getName = '']) => {
      set(observer, setName, cast(get(observable, getName)))
    })
}
