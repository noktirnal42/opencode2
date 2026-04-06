---
name: loop
description: Detect and handle repetitive patterns/loops
when: /loop
tools: [read, bash]
---
# Loop Detection

Detect when the same type of operation is being repeated and suggest a better approach.

Detection Patterns:
- Repeated edits to the same file
- Repeated bash commands
- Repeated searches for the same pattern
- Circular reasoning in responses

When Detected:
1. Pause and acknowledge the loop
2. Analyze why the approach isn't working
3. Suggest an alternative strategy
4. Ask for user guidance if stuck

Example Response:
"I've noticed we've been going in circles trying to [task]. Instead of continuing to iterate, let me suggest a different approach: [new strategy]. What do you think?"