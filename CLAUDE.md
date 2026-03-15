# lucid-skills

## What This Is
Open-source monorepo of AgentSkills plugins for the Lucid AI platform. Each plugin is a self-contained domain knowledge package that AI agents can use to gain expertise in specific areas.

## Quick Start
```bash
npm install               # Install workspace deps
bash scripts/validate-all.sh  # Validate all plugins
```

## Structure
```
skills/
  lucid-audit/            # Smart contract security v2.0 — brain layer (5 AI tools)
  lucid-bridge/           # Startup ops integration (Notion/Linear/Slack/GitHub)
  lucid-compete/          # Competitive intelligence
  lucid-defi/             # DeFi protocols (pure markdown, no MCP server)
  lucid-feedback/         # Customer feedback/NPS/CSAT
  lucid-hype/             # Growth hacking / social promotion
  lucid-invoice/          # Billing / revenue management
  lucid-meet/             # Meeting intelligence
  lucid-metrics/          # Product analytics
  lucid-observability/    # Production monitoring (Sentry, OTel) v5.0 — 7 sub-skills + brain layer (5 AI tools)
  lucid-predict/          # Prediction markets (Polymarket, Manifold) v5.0
  lucid-quantum/          # Bitcoin quantum key search intelligence v1.0 — 5 sub-skills + brain layer (9 AI tools) + 4 playbooks + memory
  lucid-propose/          # RFP / proposal engine
  lucid-prospect/         # Sales prospecting / lead discovery
  lucid-recruit/          # ATS / hiring pipeline
  lucid-seo/              # SEO intelligence
  lucid-tax/              # Crypto tax compliance v2.0 — brain layer (5 AI tools)
  lucid-trade/            # Crypto trading intelligence v5.0 — 7 sub-skills
  lucid-veille/           # Content monitoring + auto-publishing v4.0
packages/
  embedded/               # @lucid-fdn/skills-embedded — all 18 MCP factories bundled (14.9MB)
  web3-operator/          # @lucid-fdn/web3-operator — 12 web3 tools (read/reason/action) + providers + config
  web3-types/             # @lucid-fdn/web3-types — pure TypeScript interfaces (zero deps)
templates/
  skill-template/         # Starter for new plugins
scripts/
  validate-all.sh         # Lint YAML/JSON + structure check
```

## Plugin Formats
Two formats coexist:
- **Pure AgentSkills** (lucid-trade, lucid-defi): `skill.yaml` + `skills/*/SKILL.md` + `openclaw.plugin.json` + `HEARTBEAT.md`
- **TypeScript Skills** (lucid-audit, lucid-tax, lucid-predict, lucid-observability, lucid-veille, etc.): `src/` + `tsconfig.json` + `tsup.config.ts` + `vitest.config.ts` + `skills/`
- **Brain Layer pattern** (lucid-predict, lucid-trade, lucid-audit, lucid-tax, lucid-observability, lucid-quantum): `src/brain/` with types, analysis, tools, formatter

Both formats include a `package.json` and `skills/` directory with domain knowledge.

## Embedded Bundle
`packages/embedded/` — `@lucid-fdn/skills-embedded`
- Re-exports all 18 MCP server factories (`createXxxServer()`) from TypeScript skills
- tsup bundles all skills into single ESM file (`noExternal: [/@lucid-fdn\/.*/]`)
- Only `@modelcontextprotocol/sdk` remains external (peer dep)
- Used by LucidMerged worker for in-process plugin execution via InMemoryTransport
- Build: `cd packages/embedded && npm run build`
- lucid-defi is excluded (pure markdown, no MCP server)

## Conventions
- Each `skills/<name>/` is an independent npm-publishable package
- Scope: `@lucid-skills/<name>` (e.g., `@lucid-skills/trade`)
- Pure markdown skills have zero runtime dependencies
- TypeScript skills use tsup for bundling, vitest for testing
- YAML front matter in SKILL.md files for metadata

## Creating a New Plugin
1. Copy `templates/skill-template/` to `skills/lucid-<name>/`
2. Replace all `SKILL_NAME` / `SKILL_DESCRIPTION` placeholders
3. Add domain knowledge to `skills/<name>/references/`
4. Run `bash scripts/validate-all.sh` to verify

## License
MIT — see LICENSE

## Remote
`github.com/lucid-fdn/lucid-skills.git` — branch: main
