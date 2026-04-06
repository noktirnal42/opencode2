// Task Tool - Manage tasks and todo lists
import { z } from 'zod'
import { BaseTool, type ToolContext, type ToolResult } from '@/types/tool'

// Task status
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

// Task priority
export type TaskPriority = 'high' | 'medium' | 'low'

// Task interface
export interface Task {
  id: string
  content: string
  status: TaskStatus
  priority: TaskPriority
  createdAt: number
  updatedAt: number
  agent?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

// In-memory task store (would be persisted in real implementation)
const taskStore: Map<string, Task> = new Map()
let taskCounter = 0

// Generate unique task ID
function generateTaskId(): string {
  taskCounter++
  return `task_${Date.now()}_${taskCounter}`
}

// Schemas
export const TodoWriteInputSchema = z.object({
  todos: z.array(z.object({
    content: z.string().describe('Task description'),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional().describe('Task status'),
    priority: z.enum(['high', 'medium', 'low']).optional().describe('Task priority'),
    tags: z.array(z.string()).optional().describe('Task tags'),
    metadata: z.record(z.unknown()).optional().describe('Additional metadata')
  })).describe('Array of tasks to create or update')
})

export const TodoListInputSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional().describe('Filter by status'),
  priority: z.enum(['high', 'medium', 'low']).optional().describe('Filter by priority'),
  tags: z.array(z.string()).optional().describe('Filter by tags'),
  agent: z.string().optional().describe('Filter by assigned agent')
})

export const TodoGetInputSchema = z.object({
  id: z.string().describe('Task ID to retrieve')
})

export const TodoUpdateInputSchema = z.object({
  id: z.string().describe('Task ID to update'),
  content: z.string().optional().describe('New task description'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional().describe('New status'),
  priority: z.enum(['high', 'medium', 'low']).optional().describe('New priority'),
  tags: z.array(z.string()).optional().describe('New tags'),
  agent: z.string().optional().describe('Assign to agent')
})

export const TodoStopInputSchema = z.object({
  id: z.string().describe('Task ID to stop/cancel')
})

export type TodoWriteInput = z.infer<typeof TodoWriteInputSchema>
export type TodoListInput = z.infer<typeof TodoListInputSchema>
export type TodoGetInput = z.infer<typeof TodoGetInputSchema>
export type TodoUpdateInput = z.infer<typeof TodoUpdateInputSchema>
export type TodoStopInput = z.infer<typeof TodoStopInputSchema>

// TodoWrite Tool - Create or update tasks
export class TodoWriteTool extends BaseTool<TodoWriteInput, Task[]> {
  readonly name = 'todo_write'
  readonly description = 'Create and manage a task list for tracking progress. Use this to track pending and completed work.'
  readonly inputSchema = TodoWriteInputSchema
  readonly aliases = ['todowrite']

  async execute(context: ToolContext, input: TodoWriteInput): Promise<ToolResult<Task[]>> {
    const createdTasks: Task[] = []
    const now = Date.now()

    for (const todo of input.todos) {
      const task: Task = {
        id: generateTaskId(),
        content: todo.content,
        status: todo.status ?? 'pending',
        priority: todo.priority ?? 'medium',
        createdAt: now,
        updatedAt: now,
        agent: context.agent.name,
        tags: todo.tags,
        metadata: todo.metadata
      }

      taskStore.set(task.id, task)
      createdTasks.push(task)
    }

    const summary = createdTasks.length === 1
      ? `Created task: "${createdTasks[0].content}"`
      : `Created ${createdTasks.length} tasks`

    return {
      content: JSON.stringify({ summary, tasks: createdTasks }, null, 2),
      data: createdTasks
    }
  }
}

// TodoList Tool - List tasks with filters
export class TodoListTool extends BaseTool<TodoListInput, Task[]> {
  readonly name = 'todo_list'
  readonly description = 'List all tasks with optional filters'
  readonly inputSchema = TodoListInputSchema

  async execute(context: ToolContext, input: TodoListInput): Promise<ToolResult<Task[]>> {
    let tasks = Array.from(taskStore.values())

    // Apply filters
    if (input.status) {
      tasks = tasks.filter(t => t.status === input.status)
    }
    if (input.priority) {
      tasks = tasks.filter(t => t.priority === input.priority)
    }
    if (input.tags && input.tags.length > 0) {
      tasks = tasks.filter(t => t.tags && input.tags!.some(tag => t.tags!.includes(tag)))
    }
    if (input.agent) {
      tasks = tasks.filter(t => t.agent === input.agent)
    }

    // Sort by status (in_progress first), then priority, then created date
    const statusOrder: Record<TaskStatus, number> = {
      in_progress: 0,
      pending: 1,
      completed: 2,
      cancelled: 3
    }
    const priorityOrder: Record<TaskPriority, number> = {
      high: 0,
      medium: 1,
      low: 2
    }

    tasks.sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status]
      if (statusDiff !== 0) return statusDiff
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.createdAt - a.createdAt
    })

    // Format output
    const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled')
    const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'cancelled')

    const formatTask = (t: Task) => {
      const icon = t.status === 'completed' ? '✅' : 
                   t.status === 'in_progress' ? '🔄' : 
                   t.status === 'cancelled' ? '❌' : '⏳'
      const priority = t.priority === 'high' ? ' [HIGH]' : t.priority === 'low' ? ' [LOW]' : ''
      return `${icon} ${t.id}: ${t.content}${priority}`
    }

    const output: string[] = []
    if (activeTasks.length > 0) {
      output.push('## Active Tasks\n')
      activeTasks.forEach(t => output.push(formatTask(t)))
    }
    if (completedTasks.length > 0) {
      output.push('\n## Completed Tasks\n')
      completedTasks.forEach(t => output.push(formatTask(t)))
    }

    return {
      content: output.length > 0 ? output.join('\n') : 'No tasks found',
      data: tasks
    }
  }
}

// TodoGet Tool - Get single task
export class TodoGetTool extends BaseTool<TodoGetInput, Task | null> {
  readonly name = 'todo_get'
  readonly description = 'Get details of a specific task by ID'
  readonly inputSchema = TodoGetInputSchema

  async execute(context: ToolContext, input: TodoGetInput): Promise<ToolResult<Task | null>> {
    const task = taskStore.get(input.id)

    if (!task) {
      return {
        content: `Task not found: ${input.id}`,
        error: 'TASK_NOT_FOUND'
      }
    }

    const statusIcon = task.status === 'completed' ? '✅' : 
                       task.status === 'in_progress' ? '🔄' : 
                       task.status === 'cancelled' ? '❌' : '⏳'

    const details = [
      `Task: ${task.content}`,
      `Status: ${statusIcon} ${task.status}`,
      `Priority: ${task.priority.toUpperCase()}`,
      `ID: ${task.id}`,
      `Created: ${new Date(task.createdAt).toISOString()}`,
      `Updated: ${new Date(task.updatedAt).toISOString()}`,
      `Agent: ${task.agent ?? 'unassigned'}`,
      task.tags && task.tags.length > 0 ? `Tags: ${task.tags.join(', ')}` : null
    ].filter(Boolean).join('\n')

    return {
      content: details,
      data: task
    }
  }
}

// TodoUpdate Tool - Update task
export class TodoUpdateTool extends BaseTool<TodoUpdateInput, Task> {
  readonly name = 'todo_update'
  readonly description = 'Update a task status, priority, or other properties'
  readonly inputSchema = TodoUpdateInputSchema

  async execute(context: ToolContext, input: TodoUpdateInput): Promise<ToolResult<Task>> {
    const task = taskStore.get(input.id)

    if (!task) {
      return {
        content: `Task not found: ${input.id}`,
        error: 'TASK_NOT_FOUND'
      }
    }

    // Update fields
    if (input.content !== undefined) task.content = input.content
    if (input.status !== undefined) task.status = input.status
    if (input.priority !== undefined) task.priority = input.priority
    if (input.tags !== undefined) task.tags = input.tags
    if (input.agent !== undefined) task.agent = input.agent
    task.updatedAt = Date.now()

    return {
      content: `Updated task "${task.id}": ${task.content}\nStatus: ${task.status}, Priority: ${task.priority}`,
      data: task
    }
  }
}

// TodoStop Tool - Cancel a task
export class TodoStopTool extends BaseTool<TodoStopInput, Task> {
  readonly name = 'todo_stop'
  readonly description = 'Stop/cancel a running task'
  readonly inputSchema = TodoStopInputSchema

  async execute(context: ToolContext, input: TodoStopInput): Promise<ToolResult<Task>> {
    const task = taskStore.get(input.id)

    if (!task) {
      return {
        content: `Task not found: ${input.id}`,
        error: 'TASK_NOT_FOUND'
      }
    }

    task.status = 'cancelled'
    task.updatedAt = Date.now()

    return {
      content: `Cancelled task "${task.id}": ${task.content}`,
      data: task
    }
  }
}

// Export instances
export const todoWriteTool = new TodoWriteTool()
export const todoListTool = new TodoListTool()
export const todoGetTool = new TodoGetTool()
export const todoUpdateTool = new TodoUpdateTool()
export const todoStopTool = new TodoStopTool()
