import { cast, hyphenize } from '../../common'
import type { ScolaButtonElement } from '../elements/button'
import type { ScolaElement } from '../elements/element'

export function buttonAttrsInv (observer: ScolaButtonElement, observable: ScolaElement): void {
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

        return observeValue === value
      })
  )
}
