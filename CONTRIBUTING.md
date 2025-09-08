# Contributing to Vextrus ERP

Thank you for your interest in contributing to Vextrus ERP! This document provides guidelines and instructions for contributing to our enterprise resource planning system.

## 📋 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Making Contributions](#making-contributions)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)
- [Package Publishing](#package-publishing)
- [Security](#security)

## 📜 Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inspiring community for all. We expect all contributors to:
- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior
- Harassment, discrimination, or offensive comments
- Personal or political attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x LTS
- pnpm 8.x
- Docker and Docker Compose
- Git
- PostgreSQL 16 (for local development)
- Redis 7 (for local development)

### Initial Setup
```bash
# Fork and clone the repository
git clone https://github.com/yourusername/vextrus-erp.git
cd vextrus-erp

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start infrastructure services
docker-compose up -d

# Run database migrations
pnpm db:migrate

# Start development
pnpm dev
```

## 💻 Development Process

### Branch Strategy
We follow GitFlow branching strategy:
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature development
- `bugfix/*` - Bug fixes
- `hotfix/*` - Emergency production fixes
- `release/*` - Release preparation

### Workflow
1. **Create Issue**: Start by creating or claiming an issue
2. **Fork & Branch**: Create a feature branch from `develop`
3. **Develop**: Write code following our standards
4. **Test**: Ensure all tests pass
5. **Document**: Update documentation as needed
6. **Changeset**: Create a changeset for your changes
7. **PR**: Submit a pull request

## 🔧 Making Contributions

### Creating a Feature Branch
```bash
# Update your fork
git fetch upstream
git checkout develop
git merge upstream/develop

# Create feature branch
git checkout -b feature/your-feature-name
```

### Commit Guidelines
We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <subject>

# Examples
feat(auth): add OAuth2 integration
fix(project): resolve scheduling calculation error
docs(api): update REST API documentation
test(finance): add unit tests for invoice service
refactor(hr): simplify payroll calculation logic
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code change without fixing bug or adding feature
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Creating Changesets
For changes affecting packages:
```bash
# Create a changeset
pnpm changeset

# Follow prompts to:
# 1. Select affected packages
# 2. Choose version bump type (major/minor/patch)
# 3. Provide change description
```

### Pull Request Process
1. **Title**: Use conventional commit format
2. **Description**: Use the PR template
3. **Tests**: Ensure all tests pass
4. **Reviews**: Requires 2 approvals
5. **CI**: All checks must pass

#### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Changeset created (if needed)
- [ ] No security vulnerabilities introduced
```

## 📐 Coding Standards

### TypeScript
```typescript
// Use explicit types
interface User {
  id: string;
  name: string;
  email: string;
}

// Use async/await over promises
async function getUser(id: string): Promise<User> {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new NotFoundException('User not found');
  }
  return user;
}

// Use proper error handling
try {
  await processPayment(amount);
} catch (error) {
  logger.error('Payment processing failed', error);
  throw new PaymentException('Payment failed', error);
}
```

### NestJS Services
```typescript
@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private readonly eventBus: EventBus,
  ) {}

  async createProject(dto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create(dto);
    await this.projectRepository.save(project);
    
    // Emit domain event
    await this.eventBus.publish(
      new ProjectCreatedEvent(project.id, project.name)
    );
    
    return project;
  }
}
```

### React Components
```tsx
// Use functional components with TypeScript
interface ProjectCardProps {
  project: Project;
  onEdit: (id: string) => void;
}

export const ProjectCard: FC<ProjectCardProps> = ({ project, onEdit }) => {
  const { t } = useTranslation();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{project.description}</p>
        <Button onClick={() => onEdit(project.id)}>
          {t('common.edit')}
        </Button>
      </CardContent>
    </Card>
  );
};
```

## 🧪 Testing Requirements

### Test Coverage Requirements
- Unit tests: 80% minimum coverage
- Integration tests: Critical paths covered
- E2E tests: User journeys covered

### Writing Tests
```typescript
// Unit test example
describe('ProjectService', () => {
  let service: ProjectService;
  let repository: MockRepository<Project>;

  beforeEach(() => {
    const module = Test.createTestingModule({
      providers: [ProjectService],
    }).compile();
    
    service = module.get<ProjectService>(ProjectService);
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      const dto = { name: 'Test Project', startDate: new Date() };
      const result = await service.createProject(dto);
      
      expect(result).toBeDefined();
      expect(result.name).toBe(dto.name);
    });
  });
});
```

### Running Tests
```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# All tests with coverage
pnpm test:coverage
```

## 📚 Documentation

### Code Documentation
- Use JSDoc for functions and classes
- Include examples in complex functions
- Document all public APIs
- Keep README files updated

### API Documentation
```typescript
/**
 * Creates a new project
 * @param dto - Project creation data
 * @returns Created project entity
 * @throws {ValidationException} If data is invalid
 * @example
 * const project = await createProject({
 *   name: 'Construction Site A',
 *   startDate: '2024-01-01'
 * });
 */
```

## 📦 Package Publishing

### For Maintainers Only
Publishing packages requires maintainer access and GPG keys.

```bash
# Create changeset
pnpm changeset

# Version packages
pnpm version-packages

# Build packages
pnpm build:packages

# Publish (CI/CD handles this)
# Manual publishing is discouraged
```

### Security Requirements
- GPG key required for signing
- 2FA enabled on npm account
- Approved by 2 maintainers
- Security scan must pass

## 🔒 Security

### Reporting Vulnerabilities
**DO NOT** create public issues for security vulnerabilities.

Email: security@vextrus.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Security Checklist
- [ ] No hardcoded secrets
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens used
- [ ] Authentication required
- [ ] Authorization checked
- [ ] Rate limiting applied

## 🌍 Localization

### Adding Translations
```json
// locales/bn/common.json
{
  "welcome": "স্বাগতম",
  "project": "প্রকল্প",
  "save": "সংরক্ষণ করুন"
}
```

## 📞 Getting Help

### Resources
- [Documentation](https://docs.vextrus.com)
- [Discord Community](https://discord.gg/vextrus)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/vextrus)

### Contact
- General: contribute@vextrus.com
- Security: security@vextrus.com
- Discord: [Join our server](https://discord.gg/vextrus)

## 🎖️ Recognition

Contributors are recognized in:
- [CONTRIBUTORS.md](CONTRIBUTORS.md)
- Release notes
- Annual contributor report

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing to Vextrus ERP! 🚀