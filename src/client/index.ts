import '@ungap/custom-elements'
import { ScolaAudioElement } from './elements/audio'
import { ScolaBreakpoint } from './helpers/breakpoint'
import { ScolaButtonElement } from './elements/button'
import { ScolaCarouselElement } from './elements/carousel'
import { ScolaD3Element } from './elements/d3'
import { ScolaDivElement } from './elements/div'
import { ScolaDrag } from './helpers/drag'
import { ScolaDrop } from './helpers/drop'
import type { ScolaElement } from './elements/element'
import { ScolaEventElement } from './elements/event'
import { ScolaEventSourceElement } from './elements/event-source'
import { ScolaField } from './helpers/field'
import { ScolaFormElement } from './elements/form'
import { ScolaFormatElement } from './elements/format'
import { ScolaHider } from './helpers/hider'
import { ScolaIconElement } from './elements/icon'
import { ScolaImageElement } from './elements/img'
import { ScolaInputElement } from './elements/input'
import { ScolaInteract } from './helpers/interact'
import { ScolaMedia } from './helpers/media'
import { ScolaMessageElement } from './elements/message'
import { ScolaMutator } from './helpers/mutator'
import { ScolaObserver } from './helpers/observer'
import { ScolaPaste } from './helpers/paste'
import { ScolaPopupElement } from './elements/popup'
import { ScolaProgressElement } from './elements/progress'
import { ScolaPropagator } from './helpers/propagator'
import { ScolaRecorderElement } from './elements/recorder'
import { ScolaReloaderElement } from './elements/reloader'
import { ScolaRequestElement } from './elements/request'
import { ScolaSanitizer } from './helpers/sanitizer'
import { ScolaSelect } from './helpers/select'
import { ScolaSelectElement } from './elements/select'
import { ScolaSort } from './helpers/sort'
import { ScolaTableCellElement } from './elements/table-cell'
import { ScolaTableElement } from './elements/table'
import { ScolaTableRowElement } from './elements/table-row'
import { ScolaTextAreaElement } from './elements/textarea'
import { ScolaTheme } from './helpers/theme'
import { ScolaVideoElement } from './elements/video'
import { ScolaViewElement } from './elements/view'
import { ScolaWorkerElement } from './elements/worker'
import { buttonAttrs } from './observers/button-attrs'
import { buttonAttrsInv } from './observers/button-attrs-inv'
import { buttonCarousel } from './observers/button-carousel'
import { buttonView } from './observers/button-view'
import { formatCarousel } from './observers/format-carousel'
import { formatInputError } from './observers/format-input-error'
import { formatInputValue } from './observers/format-input-value'
import { formatView } from './observers/format-view'
import { inputAttrs } from './observers/input-attrs'
import { inputInput } from './observers/input-input'
import { progressRequest } from './observers/progress-request'
import { tableView } from './observers/table-view'

export * from '../common'
export * from './styles'

export type {
  ScolaElement
}

export {
  ScolaAudioElement,
  ScolaBreakpoint,
  ScolaButtonElement,
  ScolaCarouselElement,
  ScolaD3Element,
  ScolaDivElement,
  ScolaDrag,
  ScolaDrop,
  ScolaEventElement,
  ScolaEventSourceElement,
  ScolaField,
  ScolaFormElement,
  ScolaFormatElement,
  ScolaHider,
  ScolaIconElement,
  ScolaImageElement,
  ScolaInputElement,
  ScolaInteract,
  ScolaMedia,
  ScolaMessageElement,
  ScolaMutator,
  ScolaObserver,
  ScolaPaste,
  ScolaPopupElement,
  ScolaProgressElement,
  ScolaPropagator,
  ScolaRecorderElement,
  ScolaReloaderElement,
  ScolaRequestElement,
  ScolaSanitizer,
  ScolaSelect,
  ScolaSelectElement,
  ScolaSort,
  ScolaTableCellElement,
  ScolaTableElement,
  ScolaTableRowElement,
  ScolaTextAreaElement,
  ScolaTheme,
  ScolaVideoElement,
  ScolaViewElement,
  ScolaWorkerElement
}

export function defineElements (): void {
  ScolaAudioElement.define()
  ScolaButtonElement.define()
  ScolaCarouselElement.define()
  ScolaD3Element.define()
  ScolaDivElement.define()
  ScolaEventElement.define()
  ScolaEventSourceElement.define()
  ScolaFormElement.define()
  ScolaFormatElement.define()
  ScolaIconElement.define()
  ScolaImageElement.define()
  ScolaInputElement.define()
  ScolaMessageElement.define()
  ScolaPopupElement.define()
  ScolaProgressElement.define()
  ScolaRecorderElement.define()
  ScolaReloaderElement.define()
  ScolaRequestElement.define()
  ScolaSelectElement.define()
  ScolaTableCellElement.define()
  ScolaTableElement.define()
  ScolaTableRowElement.define()
  ScolaTextAreaElement.define()
  ScolaVideoElement.define()
  ScolaViewElement.define()
  ScolaWorkerElement.define()
}

export const observers = {
  'sc-button-attrs': buttonAttrs,
  'sc-button-attrs-inv': buttonAttrsInv,
  'sc-button-carousel': buttonCarousel,
  'sc-button-view': buttonView,
  'sc-format-carousel': formatCarousel,
  'sc-format-input-error': formatInputError,
  'sc-format-input-value': formatInputValue,
  'sc-format-view': formatView,
  'sc-input-attrs': inputAttrs,
  'sc-input-input': inputInput,
  'sc-progress-request': progressRequest,
  'sc-table-view': tableView
}
