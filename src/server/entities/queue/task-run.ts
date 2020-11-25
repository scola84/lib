import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'

import { Item } from './item'
import { QueueRun } from './queue-run'

export type TaskRunOptions = Record<string, unknown>

@Entity()
export class TaskRun<Payload = unknown> {
  @Column({
    type: 'varchar'
  })
  public code = 'pending'

  @CreateDateColumn()
  public created: Date

  @PrimaryGeneratedColumn()
  public id: number

  @ManyToOne(() => {
    return Item
  }, (item) => {
    return item.taskRuns
  })
  public item: Item<Payload>

  @Column({
    type: 'varchar'
  })
  public name: string

  @Column({
    type: 'simple-json'
  })
  public options: TaskRunOptions = {}

  @Column({
    type: 'integer'
  })
  public order = 1

  @ManyToOne(() => {
    return QueueRun
  }, (queueRun) => {
    return queueRun.taskRuns
  })
  public queueRun: QueueRun

  @Column({
    nullable: true,
    type: 'text'
  })
  public reason: string | null = null

  @Column({
    nullable: true,
    type: 'timestamp'
  })
  public started: Date | null = null

  @UpdateDateColumn()
  public updated: Date

  @Column({
    nullable: true,
    type: 'varchar'
  })
  public xid: string | null = null
}
