import { cast, get } from '../../../common'
import type { ScolaElement } from '../../elements/element'
import type { Struct } from '../../../common'

export function elementStateElementGetProps (observer: ScolaElement, observable: ScolaElement, query: Struct): void {
  observer.observer.toggleState(Object
    .entries({
      ...query,
      ...observer.dataset
    })
    .every(([name, value]) => {
      const observeValue = get(observable, name)
      return String(value ?? '')
        .split(',')
        .some((someValue) => {
          return cast(someValue) === observeValue
        })
    }))
}
