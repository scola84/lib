import type { Primitive } from '../../../common'

/**
 * Formats a query. Can be used as a template tag to enable syntax highlighting of queries in IDEs.
 *
 * Note: use placeholders like `$(name)` to escape values safely.
 *
 * @param strings - The strings
 * @param values - The values
 * @returns The query
 */
export function sql (strings: TemplateStringsArray, ...values: Primitive[]): string {
  return strings.reduce((result, string, index) => {
    return `${result}${string}${String(values[index] ?? '')}`
  }, '')
}
