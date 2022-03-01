import type { ScolaElement } from '../../elements/element'
import { isSame } from '../../../common'

export function elementsSame (observer: ScolaElement, observable: ScolaElement): void {
  observer.observer.toggle(isSame(observer.toObject(), observable.toObject()))
}
