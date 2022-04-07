import { cast, get } from '../../../common'
import type { ScolaElement } from '../../elements/element'

export function elementStateElementGetProps (observer: ScolaElement, observable: ScolaElement): void {
  observer.observer.toggleState(Object
    .entries(observer.dataset)
    .every(([name, value]) => {
      const observeValue = get(observable, name)
      return value
        ?.split(/\s+/u)
        .some((someValue) => {
          return cast(someValue) === observeValue
        })
    }))
}
