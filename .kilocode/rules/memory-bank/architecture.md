# System Patterns: NetShield 3D Comparator

## Architecture Overview

```
src/
├── app/
│   ├── layout.tsx                      # Global shell + metadata
│   ├── page.tsx                        # Client-side interactive comparator UI
│   ├── globals.css                     # Tailwind + custom 3D/visual utility styles
│   └── api/
│       └── security-compare/
│           └── route.ts                # Server endpoint running DNS/TLS/header checks
```

## Key Design Patterns

### 1. Split UI + Analysis Pipeline

- **Client UI (`page.tsx`)** handles form, loading/error states, and comparative graph rendering.
- **Server route (`/api/security-compare`)** performs network and security inspection using Node APIs.

### 2. Comparative Metric Normalization

Raw checks are transformed into normalized percentages for graph visualization:

- Overall security score (0-100)
- TLS health score
- Security header hardening score
- DNS integrity score

### 3. Lightweight Visual Analytics

Graph rendering uses composable HTML/CSS bars instead of external charting libraries to keep bundle size low.

### 4. Threat Signal Aggregation

Each inspected website returns:

- machine-readable booleans/metrics
- threat signal list with human-readable findings

This enables both quick scanning and detailed diagnosis.
