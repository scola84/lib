export function formatCode (value: unknown, space: number): string {
  return JSON
    .stringify(value, null, 2)
    .replace(/(?<sp>\s{2,})"(?<key>(?:[a-z_]+":))/giu, '$1$2')
    .replace(/":/giu, ':')
    .replace(/"/giu, '\'')
    .split('\n')
    .map((line) => {
      return line.padStart(line.length + space - 2)
    })
    .join('\n')
}
