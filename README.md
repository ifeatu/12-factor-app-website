# The Modern 18-Factor App Website

A comprehensive guide to building cloud-native applications in 2025, evolving the original twelve-factor methodology with five additional factors essential for modern distributed systems.

## About

This site presents **The Modern 18-Factor App** - an evolution of the original twelve factors plus six critical new factors that address today's cloud-native realities including:

- Security threats and supply chain compromises
- Microservices architectures and service meshes
- Comprehensive observability and telemetry
- Event-driven patterns and asynchronous communication
- Progressive delivery and failure isolation

## Structure

- `index.md` - Homepage with overview of all 18 factors
- `factor-*.md` - Individual factor pages with detailed explanations
- `_config.yml` - Jekyll configuration for GitHub Pages

## Deployment

This site is designed to be deployed on GitHub Pages using Jekyll:

1. Push to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Select source as "Deploy from a branch" and choose `main` branch
4. The site will be automatically built and deployed

## Local Development

To run locally:

```bash
# Install Jekyll
gem install bundler jekyll

# Create Gemfile if needed
echo 'source "https://rubygems.org"' > Gemfile
echo 'gem "github-pages", group: :jekyll_plugins' >> Gemfile

# Install dependencies
bundle install

# Serve locally
bundle exec jekyll serve
```

The site will be available at `http://localhost:4000`

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests to improve the content or add missing factors.

## License

This work builds upon the original twelve-factor methodology and is shared under the same spirit of open collaboration.

---

*Building better cloud-native applications, one factor at a time.*