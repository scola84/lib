import type { Connection as MysqlConnection } from 'mysql'

declare module 'mysql2/promise' {
  interface PoolConnection {
    connection: MysqlConnection
  }
}
