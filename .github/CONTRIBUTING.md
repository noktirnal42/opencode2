# Thank you for your contribution

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/opencode2.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Run tests: `npm test`
6. Commit your changes: `git commit -m 'feat: add your feature'`
7. Push to the branch: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Branch Strategy

- `main` - Stable release branch
- `dev` - Development branch with latest features

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Build process or auxiliary tool changes

Example:
```
feat: add team collaboration tools

Add team_create, team_delete, and team_sendmessage tools
for multi-agent collaboration.

Closes #123
```

## Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Write meaningful variable and function names
- Add JSDoc comments for public APIs

## Testing

- Write tests for new functionality
- Ensure all tests pass before submitting PR
- Aim for high test coverage

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Include code samples and error messages when reporting bugs
- Tag issues appropriately (bug, enhancement, question, etc.)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Follow GitHub's Community Guidelines

## Questions?

Feel free to open an issue for any questions about contributing!
