---
name: batch
description: Execute multiple tasks in batch
when: /batch
tools: [read, write, bash]
---
# Batch Operations

Execute multiple tasks in sequence or parallel.

Guidelines:
1. **Define Tasks**
   - List all tasks to complete
   - Identify dependencies
   - Determine execution order

2. **Execute Safely**
   - Complete tasks one by one
   - Report progress on each task
   - Stop on first critical error

3. **Report Results**
   - Summarize completed tasks
   - Note any failures
   - Provide next steps