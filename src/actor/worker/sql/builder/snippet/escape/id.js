import { Dialect } from '../dialect.js'

export class Id extends Dialect {
  resolveValueMysql (box, data, value) {
    return `\`${value.replace(/\./g, '`.`')}\``.replace('.`*`', '.*')
  }

  resolveValuePostgresql (box, data, value) {
    return `"${value.replace(/\./g, '"."')}"`.replace('."*"', '.*')
  }
}
