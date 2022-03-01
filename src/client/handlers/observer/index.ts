import { buttonCarouselHider } from './button-carousel-hider'
import { carouselSelect } from './carousel-select'
import { elementFieldError } from './element-field-error'
import { elementsAttrs } from './elements-attrs'
import { elementsAttrsInv } from './elements-attrs-inv'
import { elementsData } from './elements-data'
import { elementsSame } from './elements-same'
import { fieldElementAttr } from './field-element-attr'
import { inputMediaTime } from './input-media-time'
import { inputMediaVolume } from './input-media-volume'
import { inputRequester } from './input-requester'
import { tableRowTable } from './table-row-table'
import { tableView } from './table-view'

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
