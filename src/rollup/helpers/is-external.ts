import builtins from 'builtin-modules'

interface Package {
  dependencies?: Record<string, string>
}

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const pkg = require(`${process.cwd()}/package.json`) as Package

if (process.env.SCOLA !== undefined) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  Object.assign(pkg.dependencies ?? {}, (require(`${process.cwd()}/node_modules/@scola/lib/package.json`) as Package).dependencies ?? {})
}

const externals = [
  ...builtins,
  ...Object.keys(pkg.dependencies ?? {})
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
