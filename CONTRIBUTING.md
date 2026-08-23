# Contributing to dev-opportunity-hunter

Thanks for your interest! This is a small, complete, local-first CLI. We love focused PRs.

## Quick Start

```bash
git clone https://github.com/trenysx/dev-opportunity-hunter.git
cd dev-opportunity-hunter
npm install
node src/cli.js scan --mock        # deterministic offline demo
node src/cli.js scan --report report.md
npm test
```

## Good First Issues

- Add a new scanner: `src/scanner/pypi.js` (PyPI trending) or `src/scanner/producthunt.js`
- Add template to `src/generator/opportunityGenerator.js` (new niche wedge)
- Tune weights in `src/scorer/starPotential.js` and document why
- Improve table rendering or add `--json` filtering

## Development

- Node >=18, ESM only (`"type": "module"`)
- No build step — `src/cli.js` is the entry
- Tests: `node --test` (built-in, no jest)
- Keep `src/utils/fetch.js` dependency-free (native fetch)

## Pull Requests

1. `git checkout -b feat/my-change`
2. `npm test` must pass
3. `node src/cli.js scan --mock --report report.md` must produce valid markdown
4. Update `THIRD_PARTY.md` if you add a dep
5. One feature per PR — small > huge but broken

## License

By contributing, you agree inbound = outbound: your PR is licensed under **Apache-2.0** same as this repo, so we can distribute it.

## Code of Conduct

Be kind, be concrete, be local-first. No spam, no fake stars, no bot accounts.
