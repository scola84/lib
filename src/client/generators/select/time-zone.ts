import { I18n } from '../../../common'

export function timeZone (): Array<[string, string, boolean?]> {
  const options: Array<[string, string, boolean?]> = [
    ['America/New_York', 'New York, United States'],
    ['Europe/Amsterdam', 'Amsterdam, Nederland']
  ]

  return options.map((option) => {
    if (option[0] === I18n.timeZone) {
      option.push(true)
    }

    return option
  })
}
