import { addHook, isValidAttribute, sanitize } from 'dompurify'

addHook('uponSanitizeAttribute', (element, event) => {
  event.forceKeepAttr = ScolaSanitizer.checkAttribute(element.tagName, event.attrName, event.attrValue)
})

export class ScolaSanitizer {
  public static prefix = /^sc-/u

  public static checkAttribute (tag: string, name: string, value: string): boolean {
    return (
      isValidAttribute(tag, name, value) || (
        name === 'is' &&
        ScolaSanitizer.prefix.test(value)
      ) || (
        name === 'name' &&
        value === 'id'
      ) || ScolaSanitizer.prefix.test(name)
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
    return ScolaSanitizer.checkAttribute(tag, name, value)
  }

  public sanitizeHtml (html: string): string {
    return ScolaSanitizer.sanitizeHtml(html)
  }
}
