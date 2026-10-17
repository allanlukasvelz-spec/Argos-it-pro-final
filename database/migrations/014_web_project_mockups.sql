-- 014_web_project_mockups.sql
-- Additive only. Visual mockup persistence for Web Projects Phase 14.

CREATE TABLE IF NOT EXISTS web_project_mockups (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  version INT NOT NULL CHECK (version > 0),
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'INTERNAL_REVIEW', 'CLIENT_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'SUPERSEDED')),
  architecture_id INT NOT NULL REFERENCES web_project_architectures(id) ON DELETE RESTRICT,
  architecture_version INT NOT NULL CHECK (architecture_version > 0),
  visual_direction JSONB NOT NULL DEFAULT '{}'::jsonb,
  design_tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
  header_variant TEXT NOT NULL DEFAULT 'STANDARD'
    CHECK (header_variant IN ('STANDARD', 'CENTERED', 'MINIMAL', 'TRANSPARENT')),
  footer_variant TEXT NOT NULL DEFAULT 'STANDARD'
    CHECK (footer_variant IN ('STANDARD', 'COMPACT', 'EXPANDED')),
  preview_item_id INT REFERENCES web_project_items(id) ON DELETE SET NULL,
  preview_item_type TEXT
    CHECK (preview_item_type IS NULL OR preview_item_type IN (
      'service', 'product', 'tour', 'page', 'team_member', 'location', 'custom'
    )),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  internal_notes TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by INT REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  sent_to_client_at TIMESTAMPTZ,
  sent_to_client_by INT REFERENCES users(id) ON DELETE SET NULL,
  supersedes_mockup_id INT REFERENCES web_project_mockups(id) ON DELETE RESTRICT,
  UNIQUE (organization_id, web_project_id, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_web_project_mockups_one_active_draft
  ON web_project_mockups(web_project_id)
  WHERE status IN ('DRAFT', 'INTERNAL_REVIEW');

CREATE INDEX IF NOT EXISTS idx_web_project_mockups_org_project
  ON web_project_mockups(organization_id, web_project_id);

CREATE INDEX IF NOT EXISTS idx_web_project_mockups_architecture
  ON web_project_mockups(architecture_id);

CREATE TABLE IF NOT EXISTS web_project_mockup_pages (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  mockup_id INT NOT NULL REFERENCES web_project_mockups(id) ON DELETE RESTRICT,
  architecture_page_id INT NOT NULL REFERENCES web_project_architecture_pages(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  route TEXT NOT NULL,
  page_type TEXT NOT NULL,
  template_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'READY')),
  visual_notes TEXT,
  responsive_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_project_mockup_pages_mockup
  ON web_project_mockup_pages(mockup_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_web_project_mockup_pages_org_project
  ON web_project_mockup_pages(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_mockup_sections (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  mockup_id INT NOT NULL REFERENCES web_project_mockups(id) ON DELETE RESTRICT,
  mockup_page_id INT NOT NULL REFERENCES web_project_mockup_pages(id) ON DELETE RESTRICT,
  architecture_block_id INT REFERENCES web_project_architecture_blocks(id) ON DELETE SET NULL,
  section_type TEXT NOT NULL
    CHECK (section_type IN (
      'HEADER', 'FOOTER', 'HERO', 'INTRO', 'RICH_TEXT', 'SERVICE_GRID', 'SERVICE_DETAIL',
      'PRODUCT_GRID', 'PRODUCT_DETAIL', 'TOUR_GRID', 'TOUR_DETAIL', 'TEAM_GRID', 'LOCATIONS',
      'FEATURES', 'BENEFITS', 'PROCESS', 'FAQ', 'TESTIMONIALS', 'GALLERY', 'VIDEO', 'MAP',
      'CONTACT_FORM', 'QUOTE_FORM', 'BOOKING_WIDGET', 'ECOMMERCE_ACTION', 'CTA', 'RELATED_CONTENT',
      'NEWS', 'NEWSLETTER', 'LEGAL_TEXT', 'CUSTOM'
    )),
  variant TEXT NOT NULL DEFAULT 'DEFAULT',
  alignment TEXT NOT NULL DEFAULT 'CENTER'
    CHECK (alignment IN ('LEFT', 'CENTER', 'RIGHT')),
  density TEXT NOT NULL DEFAULT 'NORMAL'
    CHECK (density IN ('COMPACT', 'NORMAL', 'SPACIOUS')),
  visual_props JSONB NOT NULL DEFAULT '{}'::jsonb,
  asset_document_id TEXT REFERENCES web_project_documents(id) ON DELETE SET NULL,
  placeholder_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  visual_notes TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_project_mockup_sections_page
  ON web_project_mockup_sections(mockup_page_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_web_project_mockup_sections_mockup
  ON web_project_mockup_sections(mockup_id);

-- Extend review targets for mockup client feedback (additive constraint replace)
ALTER TABLE web_project_reviews DROP CONSTRAINT IF EXISTS web_project_reviews_target_type_check;

ALTER TABLE web_project_reviews
  ADD CONSTRAINT web_project_reviews_target_type_check
  CHECK (target_type IN (
    'PROJECT', 'FORM_FIELD', 'ITEM', 'DOCUMENT',
    'MOCKUP', 'MOCKUP_PAGE', 'MOCKUP_SECTION'
  ));
