export function formatWildcard (files: string[][]): string {
  return files
    .map(([file]) => {
      return `export * from './${file}'`
    })
    .join('\n')
}
