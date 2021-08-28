import type { ButtonElement } from '../elements/button'
import { ClipElement } from '../elements/clip'
import type { NodeElement } from '../elements/node'
import type { ProgressElement } from '../elements/progress'
import type { PropertyValues } from 'lit'
import type { RequestElement } from '../elements/request'
import type { ViewElement } from '../elements/view'

export default {
  'scola-clip-content': (observer: ButtonElement, observable: NodeElement, properties: PropertyValues): void => {
    if (properties.has('observe')) {
      if (observable.parentElement instanceof ClipElement) {
        if (observer.activated === true) {
          observable.parentElement.showContent(observable, 0).catch(() => {})
        } else if (observer.activated === false) {
          observable.parentElement.hideContent(observable).catch(() => {})
        }
      }
    } else if (properties.has('hidden')) {
      observer.activated = !observable.hidden
    }
  },
  'scola-clip-content-or-inner': (observer: ButtonElement, observable: NodeElement, properties: PropertyValues): void => {
    if (properties.has('observe')) {
      if (observable.parentElement instanceof ClipElement) {
        if (observer.activated === true) {
          observable.parentElement.showContentOrInner(observable, 0).catch(() => {})
        }
      }
    } else if (properties.has('hidden')) {
      observer.activated = !observable.hidden
    }
  },
  'scola-clip-inner': (observer: ButtonElement, observable: ClipElement, properties: PropertyValues): void => {
    if (properties.has('observe')) {
      if (observer.activated === true) {
        observable.showInner(0).catch(() => {})
      } else if (observer.activated === false) {
        observable.hideInner(0).catch(() => {})
      }
    } else if (properties.has('innerHidden')) {
      observer.activated = observable.innerHidden === false
    }
  },
  'scola-clip-nested': (observer: ButtonElement, observable: ClipElement, properties: PropertyValues): void => {
    if (properties.has('observe')) {
      if (observable.parentElement instanceof ClipElement) {
        if (observer.activated === true) {
          observable.parentElement.toggleNested(observable, 0).catch(() => {})
        }
      }
    } else if (properties.has('innerHidden')) {
      observer.activated = observable.innerHidden === false
    }
  },
  'scola-clip-outer': (observer: ButtonElement, observable: NodeElement, properties: PropertyValues): void => {
    if (properties.has('observe')) {
      if (observable.parentElement instanceof ClipElement) {
        if (observer.activated === true) {
          observable.parentElement.showOuter(observable, 0).catch(() => {})
        } else if (
          observer.activated === false ||
          observable.hidden
        ) {
          observable.parentElement.hideOuter(observable, 0).catch(() => {})
        }
      }
    } else if (properties.has('hidden')) {
      observer.activated = !observable.hidden
    }
  },
  'scola-node-params': (observer: ButtonElement, observable: NodeElement, properties: PropertyValues): void => {
    if (properties.has('observe')) {
      if (observer.activated === true) {
        observable.setParameters(observer.name
          .split(' ')
          .reduce((result, name) => {
            return {
              ...result,
              [name]: observer.dataset[name]
            }
          }, {}))
      }
    } else {
      observer.activated = observer.name
        .split(' ')
        .every((name) => {
          return observable.parameters[name] === observer.dataset[name]
        })
    }
  },
  'scola-node-props': (observer: ButtonElement, observable: NodeElement, properties: PropertyValues): void => {
    if (properties.has('observe')) {
      if (observer.activated === true) {
        observable.setProperties(observer.name
          .split(' ')
          .reduce((result, name) => {
            return {
              ...result,
              [name]: observer.dataset[name]
            }
          }, {}))
      }
    } else {
      observer.activated = observer.name
        .split(' ')
        .every((name) => {
          return observable[name as keyof NodeElement] === observer.dataset[name]
        })
    }
  },
  'scola-progress': (observer: ButtonElement, observable: ProgressElement, properties: PropertyValues): void => {
    if (properties.has('busy')) {
      observer.busy = observable.busy
    }
  },
  'scola-request': (observer: ButtonElement, observable: RequestElement, properties: PropertyValues): void => {
    if (properties.has('busy')) {
      observer.busy = observable.busy
    }
  },
  'scola-view-back': (observer: ButtonElement, observable: ViewElement, properties: PropertyValues): void => {
    if (properties.has('pointer')) {
      observer.disabled = !observable.hasPast
    }
  },
  'scola-view-forward': (observer: ButtonElement, observable: ViewElement, properties: PropertyValues): void => {
    if (properties.has('pointer')) {
      observer.disabled = !observable.hasFuture
    }
  },
  'scola-view-home': (observer: ButtonElement, observable: ViewElement, properties: PropertyValues): void => {
    if (properties.has('pointer')) {
      observer.disabled = !observable.hasPast
    }
  }
}
