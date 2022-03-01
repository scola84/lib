import '@ungap/custom-elements'
import { ScolaAudioElement } from './elements/audio'
import { ScolaBreakpoint } from './helpers/breakpoint'
import { ScolaButtonElement } from './elements/button'
import { ScolaButtonGroupElement } from './elements/button-group'
import { ScolaCarouselElement } from './elements/carousel'
import { ScolaDispatcherElement } from './elements/dispatcher'
import { ScolaDivElement } from './elements/div'
import { ScolaDragger } from './helpers/dragger'
import { ScolaDrawerElement } from './elements/drawer'
import { ScolaDropper } from './helpers/dropper'
import type { ScolaElement } from './elements/element'
import { ScolaEventSourceElement } from './elements/event-source'
import { ScolaField } from './helpers/field'
import { ScolaFieldSetElement } from './elements/fieldset'
import { ScolaFocuser } from './helpers/focuser'
import { ScolaFormElement } from './elements/form'
import { ScolaHider } from './helpers/hider'
import { ScolaIconElement } from './elements/icon'
import { ScolaIdbElement } from './elements/idb'
import { ScolaImageElement } from './elements/img'
import { ScolaIndexer } from './helpers/indexer'
import { ScolaInputElement } from './elements/input'
import { ScolaInteractor } from './helpers/interactor'
import { ScolaLabelElement } from './elements/label'
import { ScolaMarkedElement } from './elements/marked'
import { ScolaMedia } from './helpers/media'
import { ScolaMessageElement } from './elements/message'
import { ScolaMoverElement } from './elements/mover'
import { ScolaMutator } from './helpers/mutator'
import { ScolaObserver } from './helpers/observer'
import { ScolaOptionElement } from './elements/option'
import { ScolaPaster } from './helpers/paster'
import { ScolaPopupElement } from './elements/popup'
import { ScolaPropagator } from './helpers/propagator'
import { ScolaRecorderElement } from './elements/recorder'
import { ScolaReloaderElement } from './elements/reloader'
import { ScolaRequesterElement } from './elements/requester'
import { ScolaResizerElement } from './elements/resizer'
import { ScolaSanitizer } from './helpers/sanitizer'
import { ScolaSelectElement } from './elements/select'
import { ScolaTableCellElement } from './elements/table-cell'
import { ScolaTableElement } from './elements/table'
import { ScolaTableLister } from './helpers/table-lister'
import { ScolaTableRowElement } from './elements/table-row'
import { ScolaTableSelector } from './helpers/table-selector'
import { ScolaTableSorter } from './helpers/table-sorter'
import { ScolaTextAreaElement } from './elements/textarea'
import { ScolaTextElement } from './elements/text'
import { ScolaTheme } from './helpers/theme'
import { ScolaVideoElement } from './elements/video'
import { ScolaViewElement } from './elements/view'
import { ScolaWorkerElement } from './elements/worker'
import { buttonCarouselHider } from './handlers/observer/button-carousel-hider'
import { carouselSelect } from './handlers/observer/carousel-select'
import { elementFieldError } from './handlers/observer/element-field-error'
import { elementsAttrs } from './handlers/observer/elements-attrs'
import { elementsAttrsInv } from './handlers/observer/elements-attrs-inv'
import { elementsData } from './handlers/observer/elements-data'
import { elementsSame } from './handlers/observer/elements-same'
import { fieldElementAttr } from './handlers/observer/field-element-attr'
import { inputMediaTime } from './handlers/observer/input-media-time'
import { inputMediaVolume } from './handlers/observer/input-media-volume'
import { inputRequester } from './handlers/observer/input-requester'
import { tableRowTable } from './handlers/observer/table-row-table'
import { tableView } from './handlers/observer/table-view'

export * from '../common'
export * from './styles'

export type {
  ScolaElement
}

export {
  ScolaAudioElement,
  ScolaBreakpoint,
  ScolaButtonElement,
  ScolaButtonGroupElement,
  ScolaCarouselElement,
  ScolaDispatcherElement,
  ScolaDivElement,
  ScolaDragger,
  ScolaDrawerElement,
  ScolaDropper,
  ScolaEventSourceElement,
  ScolaField,
  ScolaFieldSetElement,
  ScolaFocuser,
  ScolaFormElement,
  ScolaHider,
  ScolaIconElement,
  ScolaIdbElement,
  ScolaImageElement,
  ScolaIndexer,
  ScolaInputElement,
  ScolaInteractor,
  ScolaLabelElement,
  ScolaMarkedElement,
  ScolaMedia,
  ScolaMessageElement,
  ScolaMoverElement,
  ScolaMutator,
  ScolaObserver,
  ScolaOptionElement,
  ScolaPaster,
  ScolaPopupElement,
  ScolaPropagator,
  ScolaRecorderElement,
  ScolaReloaderElement,
  ScolaRequesterElement,
  ScolaResizerElement,
  ScolaSanitizer,
  ScolaSelectElement,
  ScolaTableCellElement,
  ScolaTableElement,
  ScolaTableLister,
  ScolaTableRowElement,
  ScolaTableSelector,
  ScolaTableSorter,
  ScolaTextAreaElement,
  ScolaTextElement,
  ScolaTheme,
  ScolaVideoElement,
  ScolaViewElement,
  ScolaWorkerElement
}

export function defineElements (): void {
  ScolaAudioElement.define()
  ScolaButtonElement.define()
  ScolaButtonGroupElement.define()
  ScolaCarouselElement.define()
  ScolaDispatcherElement.define()
  ScolaDivElement.define()
  ScolaDrawerElement.define()
  ScolaEventSourceElement.define()
  ScolaFieldSetElement.define()
  ScolaFormElement.define()
  ScolaIconElement.define()
  ScolaIdbElement.define()
  ScolaImageElement.define()
  ScolaInputElement.define()
  ScolaLabelElement.define()
  ScolaMarkedElement.define()
  ScolaMessageElement.define()
  ScolaMoverElement.define()
  ScolaOptionElement.define()
  ScolaPopupElement.define()
  ScolaRecorderElement.define()
  ScolaReloaderElement.define()
  ScolaRequesterElement.define()
  ScolaResizerElement.define()
  ScolaSelectElement.define()
  ScolaTableCellElement.define()
  ScolaTableElement.define()
  ScolaTableRowElement.define()
  ScolaTextAreaElement.define()
  ScolaTextElement.define()
  ScolaVideoElement.define()
  ScolaViewElement.define()
  ScolaWorkerElement.define()
}

export const observerHandlers = {
  'sc-button-carousel-hider': buttonCarouselHider,
  'sc-carousel-select': carouselSelect,
  'sc-element-field-error': elementFieldError,
  'sc-elements-attrs': elementsAttrs,
  'sc-elements-attrs-inv': elementsAttrsInv,
  'sc-elements-data': elementsData,
  'sc-elements-same': elementsSame,
  'sc-field-element-attr': fieldElementAttr,
  'sc-input-media-time': inputMediaTime,
  'sc-input-media-volume': inputMediaVolume,
  'sc-input-requester': inputRequester,
  'sc-table-row-table': tableRowTable,
  'sc-table-view': tableView
}
