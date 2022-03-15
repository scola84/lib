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
  'button-carousel-hider': buttonCarouselHider,
  'carousel-select': carouselSelect,
  'element-field-error': elementFieldError,
  'elements-attrs': elementsAttrs,
  'elements-attrs-inv': elementsAttrsInv,
  'elements-data': elementsData,
  'elements-same': elementsSame,
  'field-element-attr': fieldElementAttr,
  'input-media-time': inputMediaTime,
  'input-media-volume': inputMediaVolume,
  'input-requester': inputRequester,
  'table-row-table': tableRowTable,
  'table-view': tableView
}
