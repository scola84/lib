import type { ScolaInputElement } from '../../elements/input'
import type { ScolaRequesterElement } from '../../elements/requester'

export function inputDataRequesterProps (observer: ScolaInputElement, observable: ScolaRequesterElement): void {
  if (observable.state > 0) {
    if (observable.total === 0) {
      observer.setAttribute('max', '100')

      if (observable.state === 4) {
        observer.data = {
          value: '100'
        }
      } else {
        observer.data = {
          value: '10'
        }
      }
    } else {
      observer.setAttribute('max', observable.total.toString())

      if (
        observable.total === observable.loaded &&
        observable.state === 1 &&
          observer.value === '0'
      ) {
        observer.data = {
          value: (observable.total / 10).toString()
        }
      } else {
        observer.data = {
          value: observable.loaded.toString()
        }
      }
    }

    if (observable.state === 4) {
      window.setTimeout(() => {
        observer.hidden = true

        observer.data = {
          value: '0'
        }
      })
    } else {
      observer.hidden = false
    }
  }
}
