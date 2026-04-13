# Active Context: SecureScope - Website Security Comparator

## Current State

**App Status**: ✅ Core comparison experience implemented

The project now presents a cybersecurity-focused landing experience that compares two websites for DNS reliability, TLS posture, and security-header coverage using a React UI and Node.js API route logic.

## Recently Completed

- [x] Reworked home page into an interactive security dashboard
- [x] Added website-vs-website comparison flow
- [x] Added `POST /api/security/compare` API endpoint for DNS/TLS/header analysis
- [x] Added radar graph and metric bars for side-by-side security scoring
- [x] Updated app branding in layout metadata, sidebar, and header to match security use case

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Main interactive DNS & threat comparison dashboard | ✅ |
| `src/app/api/security/compare/route.ts` | Node.js security analysis endpoint | ✅ |
| `src/components/layout/Sidebar.tsx` | Security-focused navigation branding | ✅ |
| `src/components/layout/Header.tsx` | Dashboard top bar with security context | ✅ |
| `src/app/layout.tsx` | Updated metadata and app shell | ✅ |

## Tech Stack

- **Framework**: Next.js 16 (React frontend + Node.js server routes)
- **Analysis**: Node DNS (`node:dns/promises`) + TLS (`node:tls`) checks
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React

## Security Analysis Coverage

1. **DNS Health**: A record and MX record checks
2. **TLS Strength**: Handshake + protocol + certificate window checks
3. **Header Protection**: Presence of key web security headers
4. **Threat Signals**: Consolidated threat hints derived from missing/weak checks
5. **Comparison Graph**: Radar visualization plus metric bars and winner summary

## Session History

| Date | Changes |
|------|---------|
| 2026-04-13 | Pivoted homepage from media streaming view to SecureScope threat dashboard |
| 2026-04-13 | Implemented API route for two-site security comparison and scoring |
| 2026-04-13 | Added new graph-driven UI and updated layout branding to cybersecurity focus |
