import { addHook, isValidAttribute, sanitize } from 'dompurify'

addHook('uponSanitizeAttribute', (element, event) => {
  event.forceKeepAttr = Sanitizer.checkAttribute(element.tagName, event.attrName, event.attrValue)
})

export class Sanitizer {
  public static prefix = /^sc-/u

  public static checkAttribute (tag: string, name: string, value: string): boolean {
    return (
      (
        isValidAttribute(tag, name, value)
      ) || (
        name === 'is' &&
        Sanitizer.prefix.test(value)
      ) || (
        Sanitizer.prefix.test(name)
      )
    )
  }

  public static sanitizeHtml (html: string): string {
    return sanitize(html, {
      ADD_TAGS: [
        'object',
        'param'
      ]
    })
  }

  public checkAttribute (tag: string, name: string, value: string): boolean {
    return Sanitizer.checkAttribute(tag, name, value)
  }

  public sanitizeHtml (html: string): string {
    return Sanitizer.sanitizeHtml(html)
  }
}
