# Open-Core Boundary — dev-opportunity-hunter

## Strategy: OPEN_CORE

This project uses an **Open-Core** model to maximize community adoption (stars, contributions) while preserving future commercial value.

```
Community Edition (Apache-2.0)  →  GitHub public repo, free for everyone
Commercial Edition (Private)    →  Hosted service, not in this repo
```

---

## Community Edition — What's in this repo (Apache-2.0)

Free, local-first, open-source, hackable:

| Area | Includes |
|------|----------|
| **Core CLI** | `scan`, `list-trends`, `explain` commands |
| **Scanners** | GitHub Trending (HTML parse), Hacker News Algolia API, npm search API |
| **Scoring** | 14-factor weighted StarPotential model (`src/scorer/starPotential.js`) — transparent, tunable |
| **Generator** | 10 curated templates + dynamic trend → opportunity generation |
| **Reporter** | Table (cli-table3), JSON, Markdown report (`--report report.md`) |
| **Offline** | `--mock` deterministic mode, no API key required |
| **Docs** | README, CONTRIBUTING, examples, architecture |
| **Tests** | `test/*.test.js` (node --test) |
| **License** | Apache-2.0 — commercial use allowed, patent grant, keep NOTICE |

**Goal:** easy to discover, install (`npx dev-opportunity-hunter scan`), understand in 10s, run in 5 min, contribute.

---

## Commercial Edition — NOT in this repo (private)

Not published under Apache-2.0. Built separately, may be closed-source or source-available:

| Area | Example |
|------|---------|
| **Hosted radar** | Team dashboard with daily email/Slack alerts, trend history, velocity sparklines |
| **Private sources** | Product Hunt, Reddit, PyPI, Hugging Face, private GitHub org signals |
| **Collaboration** | Team workspaces, shared shortlists, voting, assignment |
| **API & webhooks** | Webhook on new high-score opportunity, REST API for CI |
| **Enterprise** | SSO, audit log, on-prem, SLA, support |
| **AI assist** | LLM-enhanced idea expansion (optional, not core) |

No core CLI feature is paywalled. A developer can hunt opportunities fully offline without ever paying. The commercial layer adds **team + hosted + convenience** value, not basic functionality.

---

## Boundary Rules

1. **No fake paywall:** We do NOT cripple the CLI to force payment for basic scan/score/report.
2. **License respect:** Apache-2.0 grants remain for all code in this repo. Future commercial sale does NOT revoke rights to already-released community versions (per Apache-2.0 §2).
3. **Brand:** `dev-opportunity-hunter` community core may be forked per Apache-2.0; commercial brand/domain/hosted service remain with original maintainers.
4. **Contributions:** PRs to this repo are licensed under Apache-2.0 via CLA-free inbound=outbound (see CONTRIBUTING.md).

---

## If we sell / raise / spin out

What we keep:

- `dev-opportunity-hunter.com` domain (if any), hosted dashboard infra, customer list, commercial modules
- Right to offer commercial features under separate terms

What we do NOT do:

- Claim users who already got v0.1.0 under Apache-2.0 must pay retroactively
- Re-license already-published v0.1.0 code

---

## Why Open-Core?

```
Community adoption
+ GitHub stars
+ Open-source contributions
+ Future commercial value
= sustainable open source
```

*See `THIRD_PARTY.md` for dependency licenses and attribution.*
