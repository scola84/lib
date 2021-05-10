import type { Connection, DeleteResult, InsertResult, UpdateResult } from './connection'
import type { Readable } from 'stream'
import type tokens from './tokens'

export abstract class Database {
  public abstract format: (rawQuery: string, rawValues: Record<string, unknown>) => string

  public abstract tokens: tokens

  public async delete<V>(query: string, values?: Partial<V>): Promise<DeleteResult> {
    const connection = await this.connect()

    try {
      return await connection.delete<V>(query, values)
    } finally {
      connection.release()
    }
  }

  public async insert<V, R = number>(query: string, values?: Partial<V>): Promise<InsertResult<R>> {
    const connection = await this.connect()

    try {
      return await connection.insert<V, R>(query, values)
    } finally {
      connection.release()
    }
  }

  public async insertAll<V, R = number>(query: string, values?: Partial<V>): Promise<Array<InsertResult<R>>> {
    const connection = await this.connect()

    try {
      return await connection.insertAll<V, R>(query, values)
    } finally {
      connection.release()
    }
  }

  public async insertOne<V, R = number>(query: string, values?: Partial<V>): Promise<InsertResult<R>> {
    const connection = await this.connect()

    try {
      return await connection.insertOne<V, R>(query, values)
    } finally {
      connection.release()
    }
  }

  public async query<V, R>(query: string, values?: Partial<V>): Promise<R> {
    const connection = await this.connect()

    try {
      return await connection.query<V, R>(query, values)
    } finally {
      connection.release()
    }
  }

  public async select<V, R>(query: string, values?: Partial<V>): Promise<R | undefined> {
    const connection = await this.connect()

    try {
      return await connection.select<V, R>(query, values)
    } finally {
      connection.release()
    }
  }

  public async selectAll<V, R>(query: string, values?: Partial<V>): Promise<R[]> {
    const connection = await this.connect()

    try {
      return await connection.selectAll<V, R>(query, values)
    } finally {
      connection.release()
    }
  }

  public async selectOne<V, R>(query: string, values?: Partial<V>): Promise<R> {
    const connection = await this.connect()

    try {
      return await connection.selectOne<V, R>(query, values)
    } finally {
      connection.release()
    }
  }

  public async stream<V>(query: string, values?: Partial<V>): Promise<Readable> {
    const connection = await this.connect()
    const stream = connection.stream<V>(query, values)

    stream.once('close', () => {
      connection.release()
    })

    return stream
  }

  public async update<V>(query: string, values?: Partial<V>): Promise<UpdateResult> {
    const connection = await this.connect()

    try {
      return await connection.update<V>(query, values)
    } finally {
      connection.release()
    }
  }

  public abstract connect (): Promise<Connection>

  public abstract end (): Promise<void>
}
