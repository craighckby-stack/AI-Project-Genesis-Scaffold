# Contributing to DARLEK CANN ENGINE

Thank you for contributing to the DARLEK CANN CHESS ENGINE. We maintain high standards for performance and reliability in our tactical search algorithms and dashboard interfaces.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Pull Request Process](#pull-request-process)

## Code of Conduct
All contributors must adhere to the `CODE_OF_CONDUCT.md`. We prioritize technical merit and respectful collaboration.

## Development Workflow
1. **Fork & Clone**: Create a fork and clone your repository.
2. **Install Dependencies**: Use `npm install` to sync versions.
3. **Branching**: Use the naming convention `feat/`, `fix/`, or `refactor/` followed by a descriptive name.
4. **Local Development**: Run `npm run dev` to launch the dashboard.

## Coding Standards
- **TypeScript**: Strict mode is enforced. Avoid `any`. Define interfaces in `src/types/`.
- **Pure Functions**: Chess logic in `src/engine/` must be deterministic and free of side effects.
- **Performance**: Memoize expensive calculations using `useMemo` or `useCallback`. Avoid unnecessary re-renders in the React layer.
- **Accessibility**: All UI components must comply with WCAG 2.1 standards.

## Testing & Quality Assurance
- **Unit Tests**: All new logic must include tests in `__tests__/`.
- **Validation**: Run `npm run lint` and `npm run test` before committing.
- **Coverage**: Maintain or improve existing test coverage metrics.

## Pull Request Process
1. **Documentation**: Include JSDoc for all public functions.
2. **Validation**: Ensure `npm run build` passes without warnings.
3. **Review**: PRs undergo an 'Adversarial Debate' phase where maintainers evaluate algorithmic efficiency and regression risks.
4. **Merge**: Once approved, ensure your branch is rebased on the latest `main`.

