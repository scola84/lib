import type { Connection, DeleteResult, InsertResult, UpdateResult } from './connection'
import type { Readable } from 'stream'

export abstract class Database {
  public async delete (query: string, values: unknown = []): Promise<DeleteResult> {
    const connection = await this.connect()

    try {
      const result = await connection.delete(query, values)
      connection.release()
      return result
    } catch (error: unknown) {
      connection.release()
      throw error
    }
  }

  public async insert (query: string, values: unknown = []): Promise<InsertResult[]> {
    const connection = await this.connect()

    try {
      const result = await connection.insert(query, values)
      connection.release()
      return result
    } catch (error: unknown) {
      connection.release()
      throw error
    }
  }

  public async insertOne (query: string, values: unknown = []): Promise<InsertResult> {
    const connection = await this.connect()

    try {
      const result = await connection.insertOne(query, values)
      connection.release()
      return result
    } catch (error: unknown) {
      connection.release()
      throw error
    }
  }

  public async query<T>(query: string, values: unknown = []): Promise<T> {
    const connection = await this.connect()

    try {
      const result = await connection.query<T>(query, values)
      connection.release()
      return result
    } catch (error: unknown) {
      connection.release()
      throw error
    }
  }

  public async select<T>(query: string, values: unknown = []): Promise<T> {
    const connection = await this.connect()

    try {
      const result = await connection.select<T>(query, values)
      connection.release()
      return result
    } catch (error: unknown) {
      connection.release()
      throw error
    }
  }

  public async selectOne<T>(query: string, values: unknown = []): Promise<T | undefined> {
    const connection = await this.connect()

    try {
      const result = await connection.selectOne<T>(query, values)
      connection.release()
      return result
    } catch (error: unknown) {
      connection.release()
      throw error
    }
  }

  public async stream (query: string, values: unknown = []): Promise<Readable> {
    const connection = await this.connect()
    const stream = await connection.stream(query, values)

    stream.once('close', () => {
      connection.release()
    })

    return stream
  }

  public async update (query: string, values: unknown = []): Promise<UpdateResult> {
    const connection = await this.connect()

    try {
      const result = await connection.update(query, values)
      connection.release()
      return result
    } catch (error: unknown) {
      connection.release()
      throw error
    }
  }

  public abstract connect (): Promise<Connection>
}
