# Security Policy

Qualstate handles claims-quality data that can include PII and PHI. We take
security seriously and welcome responsible disclosure.

## Reporting a vulnerability

Please report suspected vulnerabilities privately to **security@qualstate.ai**.
Do **not** open a public GitHub issue for security reports.

Include, where possible:

- a description of the issue and its impact,
- steps to reproduce or a proof of concept,
- affected versions / URLs.

We aim to acknowledge reports within **2 business days** and to provide a
remediation timeline after triage. We will keep you informed through resolution
and credit reporters who wish to be named.

## Supported versions

The `main` branch and the currently deployed build are supported.

## Our security program

- **Access control:** role-based access with least privilege; administrative
  configuration (forms, rules, users, sampling, model feedback, audit) is
  restricted to the System Manager role.
- **Auditability:** an immutable audit trail records access, assignments,
  reviews, and model-update decisions.
- **Dependencies:** automated dependency updates (Dependabot) and static
  analysis (CodeQL) run against this repository.
- **Data handling:** the product roadmap targets SOC 2 Type II, ISO 27001,
  HIPAA/HITRUST, and NAIC/NYDFS alignment. See the in-app **Security & Data
  Architecture** page for the current control status and compliance roadmap.

_Note: this repository hosts a front-end prototype with synthetic data only; it
contains no real customer data and no secrets._
