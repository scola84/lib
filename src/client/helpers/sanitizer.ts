import { addHook, isValidAttribute, sanitize } from 'dompurify'

addHook('uponSanitizeAttribute', (element, event) => {
  event.forceKeepAttr =
    event.attrName.startsWith('sc-') || (
      event.attrName === 'is' &&
      event.attrValue.startsWith('sc-')
    )
})

export class ScolaSanitizer {
  public static checkAttribute (tag: string, name: string, value: string): boolean {
    return (
      name.startsWith('sc-') || (
        name === 'is' &&
        value.startsWith('sc-')
      ) || isValidAttribute(tag, name, value)
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
