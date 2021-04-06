import type { Connection, DeleteResult, InsertResult, UpdateResult } from './connection'
import type { Readable } from 'stream'

export abstract class Database {
  public async delete<V> (query: string, values: Partial<V>): Promise<DeleteResult> {
    const connection = await this.connect()

    try {
      const result = await connection.delete<V>(query, values)
      return result
    } finally {
      await connection.release()
    }
  }

  public async insert <V, R = number>(query: string, values: Partial<V>): Promise<Array<InsertResult<R>>> {
    const connection = await this.connect()

    try {
      const result = await connection.insert<V, R>(query, values)
      return result
    } finally {
      await connection.release()
    }
  }

  public async insertOne<V, R = number> (query: string, values: Partial<V>): Promise<InsertResult<R>> {
    const connection = await this.connect()

    try {
      const result = await connection.insertOne<V, R>(query, values)
      return result
    } finally {
      await connection.release()
    }
  }

  public async query<V, R>(query: string, values: Partial<V>): Promise<R> {
    const connection = await this.connect()

    try {
      const result = await connection.query<V, R>(query, values)
      return result
    } finally {
      await connection.release()
    }
  }

  public async select<V, R>(query: string, values: Partial<V>): Promise<R> {
    const connection = await this.connect()

    try {
      const result = await connection.select<V, R>(query, values)
      return result
    } finally {
      await connection.release()
    }
  }

  public async selectOne<V, R>(query: string, values: Partial<V>): Promise<R | undefined> {
    const connection = await this.connect()

    try {
      const result = await connection.selectOne<V, R>(query, values)
      return result
    } finally {
      await connection.release()
    }
  }

  public async stream<V> (query: string, values: Partial<V>): Promise<Readable> {
    const connection = await this.connect()
    const stream = await connection.stream<V>(query, values)

    stream.once('close', () => {
      connection
        .release()
        .catch(() => {})
    })

    return stream
  }

  public async update<V> (query: string, values: Partial<V>): Promise<UpdateResult> {
    const connection = await this.connect()

    try {
      const result = await connection.update<V>(query, values)
      return result
    } finally {
      await connection.release()
    }
  }

  public abstract connect (): Promise<Connection>
}
