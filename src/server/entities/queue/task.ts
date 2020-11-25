import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'

import { Queue } from './queue'
import { TaskOption } from './task-option'

@Entity()
export class Task {
  @CreateDateColumn()
  public created: Date

  @PrimaryGeneratedColumn()
  public id: number

  @Column()
  public name: string

  @OneToMany(() => {
    return TaskOption
  }, (options) => {
    return options.task
  }, {
    cascade: true
  })
  public options?: TaskOption[]

  @Column({
    type: 'integer'
  })
  public order = 1

  @ManyToOne(() => {
    return Queue
  }, (queue) => {
    return queue.tasks
  })
  public queue: Queue

  @UpdateDateColumn()
  public updated: Date
}
