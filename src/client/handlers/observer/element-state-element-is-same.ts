import type { ScolaElement } from '../../elements/element'
import { isSame } from '../../../common'

export function elementStateElementIsSame (observer: ScolaElement, observable: ScolaElement): void {
  observer.observer.toggleState(isSame(observer.data, observable.data))
}
