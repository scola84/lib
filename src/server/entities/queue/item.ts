import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'

import { QueueRun } from './queue-run'
import { TaskRun } from './task-run'

@Entity()
export class Item<Payload = unknown> {
  @Column({
    type: 'varchar'
  })
  public code = 'pending'

  @CreateDateColumn()
  public created: Date

  @PrimaryGeneratedColumn()
  public id: number

  @Column({
    type: 'simple-json'
  })
  public payload: Payload

  @ManyToOne(() => {
    return QueueRun
  }, (queueRun) => {
    return queueRun.items
  })
  public queueRun: QueueRun

  @OneToMany(() => {
    return TaskRun
  }, (taskRun) => {
    return taskRun.item
  }, {
    cascade: true
  })
  public taskRuns?: Array<TaskRun<Payload>>

  @UpdateDateColumn()
  public updated: Date
}
