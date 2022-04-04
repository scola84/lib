import { buttonStateCarouselHider } from './button-state-carousel-hider'
import { carouselSelectValue } from './carousel-select-value'
import { elementDataElementData } from './element-data-element-data'
import { elementDataFieldError } from './element-data-field-error'
import { elementStateElementAttrs } from './element-state-element-attrs'
import { elementStateElementAttrsInv } from './element-state-element-attrs-inv'
import { elementStateElementData } from './element-state-element-data'
import { elementStateElementDataInv } from './element-state-element-data-inv'
import { elementStateElementDataset } from './element-state-element-dataset'
import { elementStateElementDatasetInv } from './element-state-element-dataset-inv'
import { elementStateElementSame } from './element-state-element-same'
import { fieldDataElementAttr } from './field-data-element-attr'
import { formDataTableSelector } from './form-data-table-selector'
import { inputDataMediaTime } from './input-data-media-time'
import { inputDataMediaVolume } from './input-data-media-volume'
import { inputDataRequesterData } from './input-data-requester-data'
import { tableRowsView } from './table-rows-view'
import { tableSelectorRowTableLister } from './table-selector-row-table-lister'

export const observerHandlers = {
  'sc-button-state-carousel-hider': buttonStateCarouselHider,
  'sc-carousel-select-value': carouselSelectValue,
  'sc-element-data-element-data': elementDataElementData,
  'sc-element-data-field-error': elementDataFieldError,
  'sc-element-state-element-attrs': elementStateElementAttrs,
  'sc-element-state-element-attrs-inv': elementStateElementAttrsInv,
  'sc-element-state-element-data': elementStateElementData,
  'sc-element-state-element-data-inv': elementStateElementDataInv,
  'sc-element-state-element-dataset': elementStateElementDataset,
  'sc-element-state-element-dataset-inv': elementStateElementDatasetInv,
  'sc-element-state-element-same': elementStateElementSame,
  'sc-field-data-element-attr': fieldDataElementAttr,
  'sc-form-data-table-selector': formDataTableSelector,
  'sc-input-data-media-time': inputDataMediaTime,
  'sc-input-data-media-volume': inputDataMediaVolume,
  'sc-input-data-requester-data': inputDataRequesterData,
  'sc-table-rows-view': tableRowsView,
  'sc-table-selector-row-table-lister': tableSelectorRowTableLister
}
