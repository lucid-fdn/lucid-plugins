const d = require('../tool-manifests.json')
const fs = require('fs')
const path = require('path')

const META = {
  'lucid-audit':         { version: '2.0.0', category: 'security',     name: 'Lucid Audit',         desc: 'Smart contract security: vulnerability scanning, risk scoring, compliance checks' },
  'lucid-bridge':        { version: '1.0.0', category: 'operations',   name: 'Lucid Bridge',        desc: 'Startup ops integration: Notion, Linear, Slack, GitHub orchestration' },
  'lucid-compete':       { version: '1.0.0', category: 'intelligence', name: 'Lucid Compete',       desc: 'Competitive intelligence: market monitoring, battle cards, real-time alerts' },
  'lucid-feedback':      { version: '1.0.0', category: 'analytics',    name: 'Lucid Feedback',      desc: 'Customer feedback intelligence: NPS, CSAT, sentiment analysis, surveys' },
  'lucid-hype':          { version: '0.1.0', category: 'marketing',    name: 'Lucid Hype',          desc: 'Growth hacking: social promotion, campaign automation, engagement tracking' },
  'lucid-invoice':       { version: '1.0.0', category: 'finance',      name: 'Lucid Invoice',       desc: 'Billing and revenue management: invoicing, payments, reporting' },
  'lucid-meet':          { version: '1.0.0', category: 'productivity', name: 'Lucid Meet',          desc: 'Meeting intelligence: transcription, action items, calendar integration' },
  'lucid-metrics':       { version: '1.0.0', category: 'analytics',    name: 'Lucid Metrics',       desc: 'Product analytics: KPIs, dashboards, trend detection, reporting' },
  'lucid-observability': { version: '5.0.0', category: 'operations',   name: 'Lucid Observability', desc: 'Production monitoring: Sentry, OpenTelemetry, alerting, incident response' },
  'lucid-predict':       { version: '5.0.0', category: 'trading',      name: 'Lucid Predict',       desc: 'Prediction markets: Polymarket, Manifold, sentiment analysis, on-chain signals' },
  'lucid-propose':       { version: '0.1.0', category: 'sales',        name: 'Lucid Propose',       desc: 'RFP and proposal engine: drafting, tracking, win-rate optimization' },
  'lucid-prospect':      { version: '1.0.0', category: 'sales',        name: 'Lucid Prospect',      desc: 'Sales prospecting: lead discovery, enrichment, outreach automation' },
  'lucid-quantum':       { version: '1.0.0', category: 'blockchain',   name: 'Lucid Quantum',       desc: 'Bitcoin quantum key search intelligence: key analysis, vulnerability detection' },
  'lucid-recruit':       { version: '1.0.0', category: 'hr',           name: 'Lucid Recruit',       desc: 'ATS and hiring pipeline: candidate sourcing, screening, pipeline management' },
  'lucid-seo':           { version: '1.0.0', category: 'marketing',    name: 'Lucid SEO',           desc: 'SEO intelligence: keyword research, SERP analysis, content optimization' },
  'lucid-tax':           { version: '2.0.0', category: 'finance',      name: 'Lucid Tax',           desc: 'Crypto tax compliance: transaction classification, cost basis, tax reports' },
  'lucid-trade':         { version: '5.0.0', category: 'trading',      name: 'Lucid Trade',         desc: 'Crypto trading intelligence: technical analysis, position sizing, risk management' },
  'lucid-veille':        { version: '4.0.0', category: 'intelligence', name: 'Lucid Veille',        desc: 'Content monitoring: RSS feeds, social listening, auto-publishing, trend detection' },
  'lucid-video':         { version: '1.0.0', category: 'content',      name: 'Lucid Video',         desc: 'Video generation: scene composition, Remotion rendering, asset management' },
}

function esc(s) { return s.replace(/'/g, "''") }

const dir = path.join(__dirname, '..', 'migration-chunks')
fs.mkdirSync(dir, { recursive: true })

const skills = [...d, { slug: 'lucid-defi', tools: [] }]
const batches = []
for (let i = 0; i < skills.length; i += 4) batches.push(skills.slice(i, i + 4))

batches.forEach((batch, idx) => {
  let sql = ''
  batch.forEach(skill => {
    const meta = META[skill.slug] || { version: '4.0.0', category: 'defi', name: 'Lucid DeFi', desc: 'DeFi operations intelligence: protocol analysis, yield strategies, liquidity management' }
    const tools = skill.tools.map(t => ({ name: t.name, description: t.description, parameters: t.inputSchema }))
    const mj = esc(JSON.stringify(tools))
    sql += `INSERT INTO plugin_catalog (slug, name, description, version, category, tool_manifest, source_repo, source, verified) VALUES ('${skill.slug}', '${esc(meta.name)}', '${esc(meta.desc)}', '${meta.version}', '${meta.category}', '${mj}'::jsonb, 'raijinlabs/lucid-skills', 'first-party', true) ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, version=EXCLUDED.version, category=EXCLUDED.category, tool_manifest=EXCLUDED.tool_manifest, source_repo=EXCLUDED.source_repo, source=EXCLUDED.source, verified=EXCLUDED.verified;\n\n`
  })
  const file = path.join(dir, `batch${idx}.sql`)
  fs.writeFileSync(file, sql)
  console.log(`batch${idx}: ${batch.map(s => s.slug).join(', ')} (${Buffer.byteLength(sql)} bytes)`)
})
