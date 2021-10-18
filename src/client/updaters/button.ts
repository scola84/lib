import { Struct, isSame } from '../../common'
import type { ButtonElement } from '../elements/button'
import { ClipElement } from '../elements/clip'
import type { NodeElement } from '../elements/node'
import type { PropertyValues } from 'lit'
import type { ViewElement } from '../elements'

export default {
  'scola-button-params': (observer: ButtonElement, observable: NodeElement, properties: PropertyValues): void => {
    if (properties.has('observe')) {
      if (observer.isStateful) {
        observable.setParameters(observer.dataset)
      }
    } else {
      observer.toggleStateFromParameters(observable)
    }
  },
  'scola-button-props': (observer: ButtonElement, observable: NodeElement, properties: PropertyValues): void => {
    if (properties.has('observe')) {
      if (observer.isStateful) {
        observable.setProperties(observer.dataset)
      }
    } else {
      observer.toggleStateFromProperties(observable)
    }
  },
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
  'scola-view': (observer: ButtonElement, observable: ViewElement): void => {
    observer.activated = isSame({
      name: observer.dataset.name,
      parameters: Struct.parse(observer.dataset.parameters ?? '', observer.dataset)
    }, {
      name: observable.view?.name,
      parameters: observable.view?.parameters
    })
  }
}
