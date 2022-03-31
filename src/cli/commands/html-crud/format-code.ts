export function formatCode (value: unknown, space: number): string {
  return JSON
    .stringify(value, null, 2)
    .replace(/"(?<key>[0-9a-z_]+)":/giu, '$1:')
    .replace(/"/giu, '\'')
    .split('\n')
    .map((line) => {
      return line.padStart(line.length + space - 2)
    })
    .join('\n')
}
