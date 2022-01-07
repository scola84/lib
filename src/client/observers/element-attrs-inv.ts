import { cast, hyphenize } from '../../common'
import type { ScolaElement } from '../elements/element'

export function elementAttrsInv (observer: ScolaElement, observable: ScolaElement): void {
  observer.toggleAttribute(
    observer.getAttribute('sc-observe-state') ?? '',
    !Object
      .entries(observer.dataset)
      .every(([name, value]) => {
        const castValue = cast(value)
        const observeValue = observable.getAttribute(hyphenize(name))

        if (castValue === true) {
          return observeValue !== null
        } else if (castValue === false) {
          return observeValue === null
        }

        return value
          ?.split(' ')
          .some((someValue) => {
            return someValue === observeValue
          })
      })
  )
}
