# Third-Party Notices â€” code-graph-lite

This file lists third-party components used in the **Community Edition** (Apache-2.0).

| Name | Author / Repo | Version | License | Usage | Attribution |
|------|---------------|---------|---------|-------|-------------|
| commander | tj/commander.js | ^12.1.0 | MIT | CLI argument parsing | https://github.com/tj/commander.js |
| chalk | chalk/chalk | ^5.3.0 | MIT | Terminal colors | https://github.com/chalk/chalk |
| ora | sindresorhus/ora | ^7.0.1 | MIT | Spinner | https://github.com/sindresorhus/ora |
| cli-table3 | cli-table/cli-table3 | ^0.6.3 | MIT | Table rendering | https://github.com/cli-table/cli-table3 |

## Runtime APIs (no bundled code)

| Service | URL | Access | Notes |
|---------|-----|--------|-------|
| GitHub Trending | https://github.com/trending | Public HTML | Scraped with regex, no auth; respect GitHub ToS, cache, no abuse |
| Hacker News Algolia | https://hn.algolia.com/api/v1/search_by_date | Public JSON | No key, rate-limited gracefully with fallback mock |
| npm Search | https://registry.npmjs.org/-/v1/search | Public JSON | No key, fallback mock on failure |

No AI models, datasets, fonts, icons, or images bundled. All code is original implementation.

## License Compatibility

- Community Edition license: **Apache-2.0**
- All npm deps: **MIT** â€” compatible with Apache-2.0 (permissive, no copyleft)
- No GPL/AGPL deps; no license conflict

If you add a dependency, please update this file and verify `Apache-2.0` compatibility.

---

*Generated 2026-08-23. See LICENSE for Community Edition terms.*

