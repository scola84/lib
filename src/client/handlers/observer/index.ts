import { buttonStateCarouselHider } from './button-state-carousel-hider'
import { carouselPointerSelectValue } from './carousel-pointer-select-value'
import { elementDataElementGetAttrs } from './element-data-element-get-attrs'
import { elementDataElementGetProps } from './element-data-element-get-props'
import { elementPropsElementGetAttrs } from './element-props-element-get-attrs'
import { elementPropsElementGetProps } from './element-props-element-get-props'
import { elementStateElementGetAttrs } from './element-state-element-get-attrs'
import { elementStateElementGetProps } from './element-state-element-get-props'
import { elementStateElementHasAttrs } from './element-state-element-has-attrs'
import { elementStateElementHasProps } from './element-state-element-has-props'
import { elementStateElementIsSame } from './element-state-element-is-same'
import { elementStateFieldState } from './element-state-field-state'
import { elementStateRequesterState } from './element-state-requester-state'
import { formDataTableSelector } from './form-data-table-selector'
import { inputDataMediaTime } from './input-data-media-time'
import { inputDataMediaVolume } from './input-data-media-volume'
import { inputDataRequesterProps } from './input-data-requester-props'
import { log } from './log'
import { tableRowsViewViews } from './table-rows-view-views'
import { tableSelectorTableLister } from './table-selector-table-lister'

export const observerHandlers = {
  'sc-button-state-carousel-hider': buttonStateCarouselHider,
  'sc-carousel-pointer-select-value': carouselPointerSelectValue,
  'sc-element-data-element-get-attrs': elementDataElementGetAttrs,
  'sc-element-data-element-get-props': elementDataElementGetProps,
  'sc-element-props-element-get-attrs': elementPropsElementGetAttrs,
  'sc-element-props-element-get-props': elementPropsElementGetProps,
  'sc-element-state-element-get-attrs': elementStateElementGetAttrs,
  'sc-element-state-element-get-props': elementStateElementGetProps,
  'sc-element-state-element-has-attrs': elementStateElementHasAttrs,
  'sc-element-state-element-has-props': elementStateElementHasProps,
  'sc-element-state-element-is-same': elementStateElementIsSame,
  'sc-element-state-field-state': elementStateFieldState,
  'sc-element-state-requester-state': elementStateRequesterState,
  'sc-form-data-table-selector': formDataTableSelector,
  'sc-input-data-media-time': inputDataMediaTime,
  'sc-input-data-media-volume': inputDataMediaVolume,
  'sc-input-data-requester-props': inputDataRequesterProps,
  'sc-log': log,
  'sc-table-rows-view-views': tableRowsViewViews,
  'sc-table-selector-table-lister': tableSelectorTableLister
}
