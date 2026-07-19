# MEVIS Developer Workspace Guide

Welcome to the MEVIS developer workspace! This document outlines commands to bootstrap, build, test, and generate workspaces projects.

---

## 1. Setup & Onboarding

1. Install node dependencies:

   ```bash
   npm ci
   ```

2. Initialize environment config:
   ```bash
   cp .env.example .env
   ```

---

## 2. Command Pipeline

- **Build Workspace**: `npm run build`
- **Lint**: `npm run lint`
- **Format Verification**: `npm run format:check`
- **Typecheck**: `npm run typecheck`
- **Run Unit Tests**: `npm run test`

---

## 3. Project Stub Generator

To generate a new application, microservice, or shared package, execute:

```bash
node scripts/generate-project.js [service | app | package] <name>
```

For example:

```bash
node scripts/generate-project.js service anomaly-detector
```

This automatically scaffolds folders, `package.json` configurations, `tsconfig.json` references, and updates the workspace configuration.
