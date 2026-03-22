# Security Policy

## Reporting a Vulnerability

We take security vulnerabilities very seriously. If you discover a security vulnerability in Harbor, please email us at security@harborextension.dev or create a private security advisory.

**Please do not publicly disclose the vulnerability until we have had a chance to address it.**

### What to Include

When reporting a vulnerability, please include:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if you have one)

## Security Best Practices

### For Users

- Keep the extension updated to the latest version
- Only enable the extension when needed
- Review permissions requested by the extension
- Use strong API keys and tokens
- Don't share your API keys in public repositories

### For Developers

- Always use HTTPS for API communications
- Validate and sanitize all user input
- Store sensitive data securely
- Follow the principle of least privilege
- Keep dependencies updated
- Review code before merging
- Use Content Security Policy (CSP) headers
- Implement proper error handling

## Security Features

- Content Security Policy (CSP) enforcement
- Secure API communication with encryption
- Input validation and sanitization
- No storage of sensitive credentials in plain text
- Regular security audits of dependencies

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |

## Known Security Issues

None currently known. Please report any security issues responsibly.

## Additional Resources

- [OWASP Web Security](https://owasp.org/)
- [Chrome Extension Security](https://developer.chrome.com/docs/extensions/mv3/security/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
