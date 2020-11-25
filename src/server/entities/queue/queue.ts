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
import { Task } from './task'

@Entity()
export class Queue {
  @Column({
    nullable: true,
    type: 'varchar'
  })
  public connection: string | null = null

  @CreateDateColumn()
  public created: Date

  @PrimaryGeneratedColumn()
  public id: number

  @Column({
    type: 'varchar'
  })
  public name: string

  @ManyToOne(() => {
    return Queue
  }, (queue) => {
    return queue.previousQueue
  })
  public previousQueue: Queue

  @Column({
    nullable: true,
    type: 'text'
  })
  public query: string | null = null

  @OneToMany(() => {
    return QueueRun
  }, (queueRun) => {
    return queueRun.queue
  })
  public queueRuns?: QueueRun[]

  @Column({
    nullable: true,
    type: 'varchar'
  })
  public schedule: string | null = null

  @Column({
    nullable: true,
    type: 'timestamp'
  })
  public scheduleBegin: Date | null = null

  @Column({
    nullable: true,
    type: 'timestamp'
  })
  public scheduleEnd: Date | null = null

  @Column({
    nullable: true,
    type: 'timestamp'
  })
  public scheduleNext: Date | null = null

  @OneToMany(() => {
    return Task
  }, (task) => {
    return task.queue
  }, {
    cascade: true
  })
  public tasks?: Task[]

  @UpdateDateColumn()
  public updated: Date
}
