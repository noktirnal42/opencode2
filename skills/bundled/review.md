---
name: review
description: Code review helper
when: /review
tools: [read, grep]
---
# Code Review

Perform a thorough code review of the changes.

Review Checklist:

1. **Correctness**
   - Does the code do what it's supposed to?
   - Are edge cases handled?
   - Is error handling appropriate?

2. **Code Quality**
   - Is the code readable?
   - Are names descriptive?
   - Is there appropriate abstraction?

3. **Security**
   - Any security vulnerabilities?
   - Proper input validation?
   - No hardcoded secrets?

4. **Performance**
   - Any obvious performance issues?
   - Appropriate data structures?
   - Efficient algorithms?

5. **Testing**
   - Are there tests?
   - Is coverage adequate?
   - Tests are meaningful?

Provide a summary with specific suggestions for improvement.