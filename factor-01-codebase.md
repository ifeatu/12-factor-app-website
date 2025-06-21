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
- Examples: Google, Facebook, Microsoft

**Polyrepo Advantages:**
- Clear ownership boundaries
- Independent release cycles
- Smaller blast radius for changes
- Team autonomy

#### Modern Implementation

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - name: Build
      run: npm run build
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### Key Practices

1. **Single Source of Truth**: Everything needed to build and deploy your application should be in version control
2. **Immutable Artifacts**: Build once, deploy many times with the same artifact
3. **Traceability**: Every deployment should be traceable to a specific commit
4. **Rollback Capability**: Previous versions should always be available for rollback

### Anti-Patterns to Avoid

- Manual changes to production environments
- Shared code without proper versioning
- Configuration drift between environments
- Deploying from developer machines

### Tools and Technologies

- **Version Control**: Git (GitHub, GitLab, Bitbucket)
- **GitOps**: ArgoCD, Flux, Jenkins X
- **CI/CD**: GitHub Actions, GitLab CI, Jenkins
- **Infrastructure as Code**: Terraform, Pulumi, CloudFormation

---

[← Back to Overview](./index.md) | [Next: Dependencies →](./factor-02-dependencies.md)