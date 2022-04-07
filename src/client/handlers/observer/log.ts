import type { ScolaElement } from '../../elements'

export function log (observer: ScolaElement, observable: ScolaElement): void {
  // eslint-disable-next-line no-console
  console.log(observer.data, observable.data)
}
