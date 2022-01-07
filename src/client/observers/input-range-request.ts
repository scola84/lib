import type { ScolaInputElement } from '../elements/input'
import type { ScolaRequestElement } from '../elements/request'

export function inputRangeRequest (observer: ScolaInputElement, observable: ScolaRequestElement, mutations: MutationRecord[]): void {
  if (mutations.length > 0) {
    const loaded = Number(observable.getAttribute('sc-loaded'))
    const state = Number(observable.getAttribute('sc-state'))
    const total = Number(observable.getAttribute('sc-total'))

    if (total === 0) {
      observer.setAttribute('max', '100')

      if (state === 4) {
        observer.setData(({
          value: '100'
        }))
      } else {
        observer.setData(({
          value: '10'
        }))
      }
    } else {
      observer.setAttribute('max', total.toString())

      if (
        total === loaded &&
        state === 1 &&
        observer.value === '0'
      ) {
        observer.setData(({
          value: (total / 10).toString()
        }))
      } else {
        observer.setData(({
          value: loaded.toString()
        }))
      }
    }

    if (state === 4) {
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
