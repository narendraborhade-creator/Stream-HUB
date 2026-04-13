# Active Context: NetShield 3D - Website Security Comparator

## Current State

**App Status**: ✅ Functional MVP for comparative website security analysis

The project now provides an interactive security-focused web experience where users can compare two websites and inspect DNS/TLS/header risk posture side-by-side.

## Recently Completed

- [x] Repositioned home experience to network security use case
- [x] Added `/api/security-compare` Node.js route for DNS + TLS + header checks
- [x] Built interactive React UI for comparing two websites
- [x] Added animated 3D/glassmorphism interface and dynamic graph bars
- [x] Added per-site threat signal summaries and numeric security score

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Main interactive comparator UI | ✅ |
| `src/app/api/security-compare/route.ts` | Backend network security inspection endpoint | ✅ |
| `src/app/layout.tsx` | Simplified global layout + metadata for security product | ✅ |
| `src/app/globals.css` | Shared styles + 3D visual effects classes | ✅ |

## Tech Stack

- **Frontend**: Next.js App Router + React 19 (client interactivity)
- **Backend**: Node.js runtime APIs (`dns/promises`, `tls`) inside Next API route
- **Styling**: Tailwind CSS + custom CSS effects

## Session History

| Date | Changes |
|------|---------|
| 2026-04-13 | Built NetShield 3D security comparator with DNS/TLS threat analysis |
