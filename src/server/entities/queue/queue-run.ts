import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'

import { Item } from './item'
import { Queue } from './queue'
import type { TaskRunOptions } from './task-run'

export interface TaskRunTemplate {
  name: string
  options: TaskRunOptions
  order: number
  queueRun: QueueRun
}

@Entity()
export class QueueRun {
  @CreateDateColumn()
  public created: Date

  @Column({
    type: 'integer'
  })
  public err = 0

  @PrimaryGeneratedColumn()
  public id: number

  @OneToMany(() => {
    return Item
  }, (item) => {
    return item.queueRun
  })
  public items?: Item[]

  @Column({
    type: 'varchar'
  })
  public name: string

  @Column({
    type: 'integer'
  })
  public ok = 0

  @ManyToOne(() => {
    return Queue
  }, (queue) => {
    return queue.queueRuns
  })
  public queue: Queue

  @Column({
    type: 'integer'
  })
  public total = 0

  @UpdateDateColumn()
  public updated: Date

  public taskRuns?: TaskRunTemplate[]
}
