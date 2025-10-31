# Git Commit Changes - Agent Instruction

## Overview

Agent instruction for checking repository status, staging changes, and creating concise commit messages following NORM project conventions.

## Workflow Steps

### 1. Check Repository Status

```bash
git status
```

- Review modified, added, and deleted files
- Identify untracked files that should be included
- Note any files that should be excluded from commit

### 2. Stage Changes

```bash
# Stage all changes (most common)
git add .

# OR stage specific files/directories
git add [file-path]
git add [directory-path]/

# OR stage by pattern
git add "*.ts" "*.tsx" "*.json"
```

### 3. Generate Commit Message

#### Initial Commit on New Branch (Squash & Merge Format)

Use structured format for the **first commit** on a new feature branch, as this will become the final commit message when using "Squash & Merge":

**Format**: `<type>(<scope>): <description>`

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring without functional changes
- `style`: Code formatting, linting fixes
- `docs`: Documentation updates
- `test`: Adding or updating tests
- `chore`: Build process, dependency updates, tooling
- `perf`: Performance improvements
- `ci`: CI/CD configuration changes

**Scope Examples:**

- `explorer`: Explorer domain features
- `collect`: Data collection features
- `certificate`: Energy certificate features
- `viewer`: 3D model viewer
- `ui`: UI components/library
- `api`: API endpoints
- `db`: Database schemas/services
- `deps`: Dependencies
- `config`: Configuration files

**Guidelines for Initial Commit:**

- Keep description under 50 characters
- Use imperative mood ("add", "fix", "update" not "adds", "fixed", "updating")
- No period at the end
- Be specific but concise

**Examples:**

```text
feat(explorer): add property portfolio filtering
fix(collect): resolve heating system validation error
refactor(ui): extract reusable form components
style(api): fix linting issues in order endpoints
docs(readme): update development setup instructions
chore(deps): update @norm/database-schemas to v2.1.0
```

#### Follow-up Commits in PR

For subsequent commits within the same PR, use **simple, descriptive messages** starting with uppercase:

```text
Add validation logic
Fix TypeScript errors
Update tests
Address review feedback
Clean up imports
```

### 4. Commit Changes

```bash
git commit -m "<commit-message>"
```

## Agent Implementation

When user requests to commit changes:

1. **Run git status** to check what's changed
2. **Ask for confirmation** if there are many files or sensitive changes
3. **Stage appropriate files** (usually `git add .` unless user specifies otherwise)
4. **Determine commit type**:
   - **Initial commit on new branch**: Use structured format `<type>(<scope>): <description>`
   - **Follow-up commits in PR**: Use simple descriptive messages
5. **Analyze the changes** to determine:
   - Primary type of change (feat, fix, refactor, etc.) - for initial commits
   - Affected scope/domain - for initial commits
   - Core functionality being modified
6. **Generate appropriate commit message**:
   - Structured format for initial branch commit (will be used in squash & merge)
   - Simple descriptive message for follow-up commits
7. **Execute commit** with the generated message
8. **Confirm success** and show commit hash

### How to Detect Initial vs Follow-up Commit

```bash
# Check if this is the first commit on the branch
git log --oneline origin/main..HEAD

# If output is empty or shows only current changes, it's likely the initial commit
# If output shows previous commits, it's a follow-up commit
```

## Special Cases

**Large changesets**: Break into logical commits if changes span multiple domains
**Generated files**: Include auto-generated files (translations, schemas) in same commit as source changes
**Version bumps**: Use `chore(release): bump version to X.Y.Z`
**Merge commits**: Let git handle merge commit messages
**Emergency fixes**: Use `hotfix` type for critical production fixes

## Quality Checks

Before committing, ensure:

- [ ] Code follows NORM style guidelines (run `npm run format:biome:fix`)
- [ ] No TypeScript errors (run `npx nx typecheck [project]`)
- [ ] No sensitive data in commit (API keys, secrets, personal info)
- [ ] Commit message is clear and follows convention
- [ ] Changes are logically grouped in single commit

## Related Commands

```bash
# View detailed diff before staging
git diff

# View staged changes before committing
git diff --cached

# Amend last commit message
git commit --amend -m "new message"

# Undo last commit (keep changes)
git reset --soft HEAD~1
```
