# Factor 1: Codebase

## One codebase tracked in revision control, many deploys

### Original Principle

The twelve-factor app is tracked in a version control system such as Git, Mercurial, or Subversion. There is a one-to-one correlation between the codebase and the app. Multiple apps sharing the same code violates twelve-factor - factor out shared code into libraries.

### Modern Evolution

While the core principle remains essential, modern architectures have added layers of sophistication:

#### GitOps Revolution

Git has become more than version control - it's now the single source of truth for:
- Application code
- Infrastructure definitions (Infrastructure as Code)
- Configuration specifications
- Deployment manifests
- Security policies

Tools like ArgoCD and Flux continuously synchronize Git repositories with running environments, making Git the control plane for entire systems.

#### Monorepo vs Polyrepo

The original factor assumed one repository per application, but modern practices have diverged:

**Monorepo Advantages:**
- Atomic commits across services
- Simplified dependency management
- Consistent tooling and standards
- Examples: Google, Facebook, Twitter

**Polyrepo Advantages:**
- Clear service boundaries
- Independent deployment cycles
- Distributed team ownership
- Natural fit for microservices

The key insight: **one codebase per deployable unit**, whether that's a monolithic application or an individual microservice.

#### Branching Strategies

Modern development has standardized on Git Flow or GitHub Flow:
- **Main/Master branch** represents production
- **Feature branches** for development
- **Pull requests** for code review
- **Protected branches** enforce quality gates

### Implementation Guidelines

1. **Choose Your Strategy**
   - Monorepo for tight coupling and shared standards
   - Polyrepo for team autonomy and service isolation

2. **Establish Git Conventions**
   - Meaningful commit messages (Conventional Commits)
   - Branch naming standards
   - Pull request templates
   - Automated checks (linting, tests, security scans)

3. **Implement GitOps**
   - Declarative infrastructure in Git
   - Automated synchronization to environments
   - Rollback through Git revert
   - Audit trail through Git history

4. **Version Everything**
   - Application code
   - Infrastructure definitions
   - Configuration templates
   - Documentation
   - CI/CD pipelines

### Anti-Patterns to Avoid

- **Code duplication** across repositories
- **Binary artifacts** in version control
- **Secrets** committed to repositories
- **Generated code** checked into Git
- **Large files** without Git LFS

### Modern Tools and Services

- **Version Control**: GitHub, GitLab, Bitbucket
- **GitOps**: ArgoCD, Flux, Jenkins X
- **Monorepo Tools**: Bazel, Nx, Lerna, Rush
- **Git Workflows**: GitHub Actions, GitLab CI, Bitbucket Pipelines

### Example Implementation

```yaml
# .github/workflows/gitops.yml
name: GitOps Workflow
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Update Kubernetes Manifests
        run: |
          kubectl apply -f k8s/
      - name: Sync with ArgoCD
        run: |
          argocd app sync my-app
```

### Key Takeaways

1. Git remains the foundation of modern development
2. GitOps extends version control to operations
3. Choose monorepo vs polyrepo based on organizational needs
4. Version everything, not just code
5. Automation and tooling are essential for scale

---

### Sources

- `https://12factor.net/codebase`
- `https://www.weave.works/technologies/gitops/`
- `https://github.com/joelparkerhenderson/monorepo-vs-polyrepo`
- `https://argo-cd.readthedocs.io/`
- `https://cacm.acm.org/magazines/2016/7/204032-why-google-stores-billions-of-lines-of-code-in-a-single-repository/fulltext`