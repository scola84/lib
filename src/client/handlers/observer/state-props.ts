import { cast, get, toJoint } from '../../../common'
import type { ScolaElement } from '../../elements/element'

export function stateProps (observer: ScolaElement, observable: ScolaElement): void {
  observer.observer.toggleState(Object
    .entries(observer.dataset)
    .every(([name, value]) => {
      const observeValue = cast(get(observable, toJoint(name, {
        caps: false,
        separator: '.'
      })))

      return value
        ?.split(/\s+/u)
        .some((someValue) => {
          return cast(someValue) === observeValue
        })
    }))
}
