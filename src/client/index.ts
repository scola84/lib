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
import { buttonCarouselHider } from './observers/button-carousel-hider'
import { elementHasAttrs } from './observers/element-has-attrs'
import { elementHasAttrsInv } from './observers/element-has-attrs-inv'
import { elementHasData } from './observers/element-has-data'
import { elementSetData } from './observers/element-set-data'
import { fieldElementAttr } from './observers/field-element-attr'
import { inputMediaTime } from './observers/input-media-time'
import { inputMediaVolume } from './observers/input-media-volume'
import { inputRequester } from './observers/input-requester'
import { tableRowTable } from './observers/table-row-table'
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

export const observers = {
  'sc-button-carousel-hider': buttonCarouselHider,
  'sc-element-has-attrs': elementHasAttrs,
  'sc-element-has-attrs-inv': elementHasAttrsInv,
  'sc-element-has-data': elementHasData,
  'sc-element-set-data': elementSetData,
  'sc-field-element-attr': fieldElementAttr,
  'sc-input-media-time': inputMediaTime,
  'sc-input-media-volume': inputMediaVolume,
  'sc-input-requester': inputRequester,
  'sc-table-row-table': tableRowTable,
  'sc-table-view': tableView
}
