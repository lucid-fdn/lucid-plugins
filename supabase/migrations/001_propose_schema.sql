-- Lucid Propose schema
-- RFP & Proposal Engine

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Proposals table
create table if not exists propose_proposals (
  id uuid primary key default uuid_generate_v4(),
  tenant_id text not null,
  title text not null,
  client_name text not null,
  client_email text not null,
  status text not null default 'draft'
    check (status in ('draft', 'review', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
  rfp_content text,
  sections jsonb not null default '[]'::jsonb,
  pricing_model text not null default 'fixed'
    check (pricing_model in ('fixed', 'hourly', 'retainer', 'milestone', 'value_based', 'subscription')),
  total_amount numeric,
  currency text not null default 'USD',
  valid_until timestamptz,
  submitted_at timestamptz,
  viewed_at timestamptz,
  decided_at timestamptz,
  template_id uuid,
  win_probability integer check (win_probability >= 0 and win_probability <= 100),
  tags text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_propose_proposals_tenant on propose_proposals(tenant_id);
create index idx_propose_proposals_status on propose_proposals(status);
create index idx_propose_proposals_client on propose_proposals(client_name);
create index idx_propose_proposals_created on propose_proposals(created_at desc);

-- Sections table
create table if not exists propose_sections (
  id uuid primary key default uuid_generate_v4(),
  proposal_id uuid not null references propose_proposals(id) on delete cascade,
  section_type text not null
    check (section_type in ('executive_summary', 'problem_statement', 'solution', 'methodology',
      'timeline', 'team', 'pricing', 'case_study', 'references', 'terms', 'appendix', 'custom')),
  title text not null,
  content text not null default '',
  sort_order integer not null default 0,
  is_included boolean not null default true
);

create index idx_propose_sections_proposal on propose_sections(proposal_id);
create index idx_propose_sections_type on propose_sections(section_type);

-- Templates table
create table if not exists propose_templates (
  id uuid primary key default uuid_generate_v4(),
  tenant_id text not null,
  name text not null,
  category text not null
    check (category in ('saas', 'consulting', 'development', 'marketing', 'design', 'infrastructure', 'general')),
  description text not null default '',
  sections jsonb not null default '[]'::jsonb,
  default_pricing text not null default 'fixed'
    check (default_pricing in ('fixed', 'hourly', 'retainer', 'milestone', 'value_based', 'subscription')),
  is_active boolean not null default true,
  use_count integer not null default 0,
  win_rate numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_propose_templates_tenant on propose_templates(tenant_id);
create index idx_propose_templates_category on propose_templates(category);

-- Content blocks table
create table if not exists propose_content_blocks (
  id uuid primary key default uuid_generate_v4(),
  tenant_id text not null,
  title text not null,
  content text not null,
  category text not null,
  tags text[] not null default '{}',
  usage_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_propose_content_tenant on propose_content_blocks(tenant_id);
create index idx_propose_content_category on propose_content_blocks(category);

-- Analytics table
create table if not exists propose_analytics (
  id uuid primary key default uuid_generate_v4(),
  proposal_id uuid not null references propose_proposals(id) on delete cascade,
  event_type text not null
    check (event_type in ('created', 'sent', 'viewed', 'section_viewed', 'accepted', 'rejected')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_propose_analytics_proposal on propose_analytics(proposal_id);
create index idx_propose_analytics_event on propose_analytics(event_type);
create index idx_propose_analytics_created on propose_analytics(created_at desc);

-- Row Level Security
alter table propose_proposals enable row level security;
alter table propose_sections enable row level security;
alter table propose_templates enable row level security;
alter table propose_content_blocks enable row level security;
alter table propose_analytics enable row level security;

-- RLS Policies (tenant isolation)
create policy "propose_proposals_tenant" on propose_proposals
  for all using (tenant_id = current_setting('app.tenant_id', true));

create policy "propose_templates_tenant" on propose_templates
  for all using (tenant_id = current_setting('app.tenant_id', true));

create policy "propose_content_blocks_tenant" on propose_content_blocks
  for all using (tenant_id = current_setting('app.tenant_id', true));
