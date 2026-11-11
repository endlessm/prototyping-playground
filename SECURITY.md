# Security

Security fixes target the current version on `main`; there are no release branches.

## Reporting a vulnerability

Use [GitHub's private vulnerability reporting](https://github.com/endlessm/prototyping-playground/security/advisories/new) to contact the maintainers privately. Include the affected commit, reproduction steps, the expected and actual behavior, and the likely impact. Remove credentials and private data from examples.

Please keep exploit details out of public issues while the report is being assessed. Ordinary bugs and feature requests belong in GitHub issues.

## Intended environment

Run the development server in a trusted local environment. Its file-editing features are designed for local development, not as a remotely exposed authenticated service.

Prototype code and design systems run as trusted code within the studio application. Contributor ownership checks, dependency rules and scoped styles help organize work; they do not provide an execution sandbox for untrusted code. Review imported code before running it.
