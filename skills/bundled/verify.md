---
name: verify
description: Verify code changes and run tests
when: /verify
tools: [read, bash]
---
# Code Verification

Verify that code changes are correct and tests pass.

Process:
1. **Review Changes**
   - Check modified files
   - Review the diff
   - Ensure changes are intentional

2. **Run Tests**
   - Execute relevant tests
   - Check test coverage
   - Verify all tests pass

3. **Check Linting**
   - Run linter
   - Fix any warnings
   - Ensure code style is consistent

4. **Verify Functionality**
   - Test the feature manually if needed
   - Check edge cases
   - Verify error handling