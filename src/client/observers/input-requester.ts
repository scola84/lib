import type { ScolaInputElement } from '../elements/input'
import type { ScolaRequesterElement } from '../elements/requester'

export function inputRequester (observer: ScolaInputElement, observable: ScolaRequesterElement, mutations: MutationRecord[]): void {
  if (mutations.length > 0) {
    const data = observable.getData()

    if (data.total === 0) {
      observer.setAttribute('max', '100')

      if (data.state === 4) {
        observer.setData(({
          value: '100'
        }))
      } else {
        observer.setData(({
          value: '10'
        }))
      }
    } else {
      observer.setAttribute('max', data.total.toString())

      if (
        data.total === data.loaded &&
        data.state === 1 &&
        observer.value === '0'
      ) {
        observer.setData(({
          value: (data.total / 10).toString()
        }))
      } else {
        observer.setData(({
          value: data.loaded.toString()
        }))
      }
    }

    if (data.state === 4) {
      window.setTimeout(() => {
        observer.hidden = true

        observer.setData(({
          value: '0'
        }))
      })
    } else {
      observer.hidden = false
    }
  }
}
