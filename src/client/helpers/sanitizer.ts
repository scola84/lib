import { addHook, isValidAttribute, sanitize } from 'dompurify'

addHook('uponSanitizeAttribute', (element, event) => {
  event.forceKeepAttr = Sanitizer.testAttribute(element.tagName, event.attrName, event.attrValue)
})

export class Sanitizer {
  public static prefix = /^sc-/u

  public static checkAttributes (): void {
    document
      .querySelectorAll('*')
      .forEach((element) => {
        Array.from(element.attributes).forEach((attribute) => {
          if (
            attribute.name === 'aria-errormessage' ||
              attribute.name === 'aria-describedby' ||
              attribute.name === 'aria-labelledby' ||
              attribute.name === 'for'
          ) {
            if (document.getElementById(attribute.value) === null) {
              // eslint-disable-next-line no-console
              console.error(`${attribute.name} "${attribute.value}"`)
            }
          }

          if (
            attribute.name === 'sc-observe-target' ||
              attribute.name.startsWith('sc-on')
          ) {
            attribute.value
              .split(' ')
              .forEach((value) => {
                const [,target] = value.split('@')

                if (document.querySelector(target) === null) {
                  // eslint-disable-next-line no-console
                  console.error(`${attribute.name} "${target}"`)
                }
              })
          }
        })
      })
  }

  public static sanitizeHtml (html: string): string {
    return sanitize(html, {
      ADD_TAGS: [
        'object',
        'param'
      ]
    })
  }

  public static testAttribute (tag: string, name: string, value: string): boolean {
    return ((
      isValidAttribute(tag, name, value)
    ) || (
      name === 'name'
    ) || (
      name === 'is' &&
      Sanitizer.prefix.test(value)
    ) || (
      Sanitizer.prefix.test(name)
    ))
  }

  public sanitizeHtml (html: string): string {
    return Sanitizer.sanitizeHtml(html)
  }

  public testAttribute (tag: string, name: string, value: string): boolean {
    return Sanitizer.testAttribute(tag, name, value)
  }
}
