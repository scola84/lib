import { Dialect } from '../dialect.js'

export class Id extends Dialect {
  resolveMysql (box, data, value) {
    return `\`${value.replace(/\./g, '`.`')}\``.replace('.`*`', '.*')
  }

  resolvePostgresql (box, data, value) {
    return `"${value.replace(/\./g, '"."')}"`.replace('."*"', '.*')
  }
}
