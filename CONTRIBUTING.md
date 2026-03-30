# Contributing

Contributions to this project are [released](https://help.github.com/articles/github-terms-of-service/#6-contributions-under-repository-license) to the public under the [project's open source license](LICENSE).

Everyone is welcome to contribute to this project. Contributing doesn't just mean submitting pull requests—there are many different ways for you to get involved, including answering questions, reporting issues, improving documentation, or suggesting new features.

## How to Contribute

### Reporting Issues

If you find a bug or have a feature request:
1. Check if the issue already exists in the [GitHub Issues](https://github.com/orassayag/sender/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Error codes (if applicable)
   - Your environment details (OS, Node version, SendGrid account status)

### Submitting Pull Requests

1. Fork the repository
2. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes following the code style guidelines below
4. Test your changes thoroughly
5. Commit with clear, descriptive messages
6. Push to your fork and submit a pull request

### Code Style Guidelines

This project uses:
- **JavaScript (ES6+)** with ES modules
- **ESLint** for code quality

Before submitting:
```bash
# Install dependencies
npm install

# Test the application
npm start

# Run specific scripts
npm run send      # Test email sending
npm run status    # Check system status
npm run backup    # Create backup
```

### Coding Standards

1. **Functions with 3+ parameters**: Use object parameters
2. **Error handling**: Include error codes in format `(1000XXX)`
3. **No comments inside functions**: Keep function bodies clean
4. **Naming**: Use clear, descriptive names for variables and functions
5. **Settings**: Never commit sensitive data (API keys, passwords) - use example files
6. **MongoDB**: Ensure proper connection handling and cleanup

### Adding New Features

When adding new features:
1. Create appropriate models in `src/core/models/`
2. Add service logic in `src/services/files/`
3. Update scripts in `src/scripts/` if needed
4. Add enums in `src/core/enums/files/` for new constants
5. Update `src/settings/settings.js` for new configuration options
6. Test thoroughly in development mode before production mode

### Security Considerations

When contributing:
- **Never hardcode** API keys, database credentials, or sensitive data
- Use environment variables or separate configuration files (excluded from git)
- Validate all email addresses before processing
- Sanitize user inputs
- Follow SendGrid best practices for email sending
- Respect rate limits and daily quotas

### Testing Guidelines

Before submitting a pull request:
1. Set `IS_PRODUCTION_MODE: false` in settings
2. Test with small email batches
3. Verify MongoDB connection and data storage
4. Check log files in `dist/` directory
5. Test both success and error scenarios
6. Ensure proper cleanup of resources

## Questions or Need Help?

Please feel free to contact me with any question, comment, pull-request, issue, or any other thing you have in mind.

* Or Assayag <orassayag@gmail.com>
* GitHub: https://github.com/orassayag
* StackOverflow: https://stackoverflow.com/users/4442606/or-assayag?tab=profile
* LinkedIn: https://linkedin.com/in/orassayag

Thank you for contributing! 🙏
