# Project Brief: NetShield 3D Comparator

## Purpose

Deliver a modern React + Node.js web application for security teams and developers to compare two websites across DNS security, TLS posture, and exploit-surface indicators.

## Target Users

- Security analysts performing fast website posture checks
- Developers validating deployment hardening basics
- Tech evaluators comparing trust posture of multiple domains

## Core Use Case

Users enter two website domains and receive:

1. Side-by-side security score comparison
2. DNS integrity checks (records/features)
3. TLS and HTTPS reachability indicators
4. Security header hardening visibility
5. Threat signals summarized in plain language

## Key Requirements

### Must Have

- Input and compare two websites in one run
- Backend security analysis workflow using Node.js
- Interactive, polished UI with 3D feel
- Visual comparison graph for key security metrics
- Human-readable threat findings

### Nice to Have

- Historical comparisons and trend charts
- Exportable PDF/CSV reports
- Deeper DNSSEC validation and WHOIS enrichment

## Constraints

- Runs inside Next.js 16 application structure
- Uses built-in Node/network APIs where possible
- Keeps implementation lightweight without heavy chart libraries
