import builtins from 'builtin-modules'

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const pkg = require(`${process.cwd()}/package.json`) as Record<string, unknown>

if (process.env.SCOLA !== undefined) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  Object.assign(pkg.dependencies, (require(`${process.cwd()}/node_modules/@scola/lib/package.json`) as Record<string, unknown>).dependencies)
}

const externals = [
  ...builtins,
  ...Object.keys((pkg.dependencies ?? {}) as Record<string, unknown>)
]

export function isExternal (id: string): boolean {
  return externals
    .filter((external) => {
      return (
        process.env.SCOLA === undefined ||
        external !== '@scola/lib'
      )
    })
    .some((external) => {
      return id.startsWith(external)
    })
}
