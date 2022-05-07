import { I18n } from '../../../common'

export function locale (): Array<[string, string, boolean?]> {
  const options: Array<[string, string, boolean?]> = [
    ['en-US', 'English (United States)'],
    ['nl-NL', 'Nederlands (Nederland)']
  ]

  return options.map((option) => {
    if (option[0] === I18n.locale) {
      option.push(true)
    }

    return option
  })
}
