-- 013_web_project_architecture.sql
-- Additive only. Information architecture persistence for Web Projects Phase 13.

CREATE TABLE IF NOT EXISTS web_project_architectures (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  version INT NOT NULL CHECK (version > 0),
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'APPROVED', 'SUPERSEDED')),
  primary_language TEXT,
  additional_languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  language_selector_required BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by INT REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  supersedes_architecture_id INT REFERENCES web_project_architectures(id) ON DELETE RESTRICT,
  UNIQUE (organization_id, web_project_id, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_web_project_architectures_one_draft
  ON web_project_architectures(web_project_id)
  WHERE status = 'DRAFT';

CREATE INDEX IF NOT EXISTS idx_web_project_architectures_org_project
  ON web_project_architectures(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_architecture_pages (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  architecture_id INT NOT NULL REFERENCES web_project_architectures(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  route TEXT NOT NULL,
  page_type TEXT NOT NULL
    CHECK (page_type IN (
      'HOME', 'ABOUT', 'SERVICE_INDEX', 'SERVICE_DETAIL', 'PRODUCT_INDEX', 'PRODUCT_DETAIL',
      'TOUR_INDEX', 'TOUR_DETAIL', 'TEAM', 'LOCATIONS', 'LOCATION_DETAIL', 'CONTACT', 'FAQ',
      'BLOG_INDEX', 'ARTICLE', 'LEGAL', 'BOOKING', 'ECOMMERCE', 'LANDING', 'CUSTOM'
    )),
  template_type TEXT NOT NULL
    CHECK (template_type IN ('UNIQUE', 'INDEX', 'DETAIL', 'LEGAL', 'SYSTEM', 'LANDING')),
  parent_page_id INT REFERENCES web_project_architecture_pages(id) ON DELETE RESTRICT,
  sort_order INT NOT NULL DEFAULT 0,
  navigation_placement TEXT NOT NULL DEFAULT 'NONE'
    CHECK (navigation_placement IN ('PRIMARY', 'SECONDARY', 'UTILITY', 'FOOTER', 'HIDDEN', 'NONE')),
  navigation_label TEXT,
  purpose TEXT,
  summary TEXT,
  primary_cta TEXT,
  secondary_cta TEXT,
  seo_priority TEXT NOT NULL DEFAULT 'MEDIUM'
    CHECK (seo_priority IN ('HIGH', 'MEDIUM', 'LOW', 'NONE')),
  content_readiness TEXT NOT NULL DEFAULT 'PARTIAL'
    CHECK (content_readiness IN ('READY', 'PARTIAL', 'MISSING', 'NOT_APPLICABLE')),
  content_binding_type TEXT
    CHECK (content_binding_type IS NULL OR content_binding_type IN (
      'service', 'product', 'tour', 'team_member', 'location', 'page', 'custom'
    )),
  content_binding_mode TEXT
    CHECK (content_binding_mode IS NULL OR content_binding_mode IN ('collection', 'detail', 'single')),
  source_page_item_id INT REFERENCES web_project_items(id) ON DELETE SET NULL,
  migration_disposition TEXT
    CHECK (migration_disposition IS NULL OR migration_disposition IN (
      'KEEP', 'REDESIGN', 'MERGE', 'REMOVE', 'REDIRECT'
    )),
  entity_count INT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_project_architecture_pages_arch
  ON web_project_architecture_pages(architecture_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_web_project_architecture_pages_org_project
  ON web_project_architecture_pages(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_architecture_blocks (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  architecture_id INT NOT NULL REFERENCES web_project_architectures(id) ON DELETE RESTRICT,
  architecture_page_id INT NOT NULL REFERENCES web_project_architecture_pages(id) ON DELETE RESTRICT,
  block_type TEXT NOT NULL
    CHECK (block_type IN (
      'HERO', 'INTRO', 'RICH_TEXT', 'SERVICE_GRID', 'SERVICE_DETAIL', 'PRODUCT_GRID', 'PRODUCT_DETAIL',
      'TOUR_GRID', 'TOUR_DETAIL', 'TEAM_GRID', 'LOCATIONS', 'FEATURES', 'BENEFITS', 'PROCESS', 'FAQ',
      'TESTIMONIALS', 'GALLERY', 'VIDEO', 'MAP', 'CONTACT_FORM', 'QUOTE_FORM', 'BOOKING_WIDGET',
      'ECOMMERCE_ACTION', 'CTA', 'RELATED_CONTENT', 'NEWS', 'NEWSLETTER', 'LEGAL_TEXT', 'CUSTOM'
    )),
  sort_order INT NOT NULL DEFAULT 0,
  title TEXT,
  purpose TEXT,
  notes TEXT,
  content_source_type TEXT
    CHECK (content_source_type IS NULL OR content_source_type IN (
      'service', 'product', 'tour', 'team_member', 'location', 'page', 'custom'
    )),
  content_source_id INT,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_project_architecture_blocks_page
  ON web_project_architecture_blocks(architecture_page_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_web_project_architecture_blocks_arch
  ON web_project_architecture_blocks(architecture_id);
