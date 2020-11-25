import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'

import { Task } from './task'

@Entity()
export class TaskOption {
  @CreateDateColumn()
  public created: Date

  @PrimaryGeneratedColumn()
  public id: number

  @Column({
    type: 'varchar'
  })
  public name: string

  @ManyToOne(() => {
    return Task
  }, (task) => {
    return task.options
  })
  public task: Task

  @UpdateDateColumn()
  public updated: Date

  @Column({
    type: 'varchar'
  })
  public value: string
}
