import { cast, get, isNil, toJoint } from '../../../common'
import type { ScolaElement } from '../../elements/element'

export function elementStateElementDataInv (observer: ScolaElement, observable: ScolaElement): void {
  window.requestAnimationFrame(() => {
    const { data } = observable

    observer.observer.toggleState(!Object
      .entries(observer.dataset)
      .every(([name, value]) => {
        return value
          ?.split(/\s+/u)
          .some((someValue) => {
            const castValue = cast(someValue)

            const observeValue = get(data, toJoint(name, {
              separator: '.'
            }))

            if (castValue === true) {
              return !isNil(observeValue)
            } else if (castValue === false) {
              return isNil(observeValue)
            }

            return someValue === observeValue
          })
      }))
  })
}
