import { cast, get, set } from '../../../common'
import type { ScolaElement } from '../../elements'

export function dataProps (observer: ScolaElement, observable: ScolaElement): void {
  observer.data = Object
    .entries(observer.dataset)
    .reduce((result, [setName, getName = '']) => {
      return set(result, setName, cast(get(observable, getName)))
    }, {})
}
