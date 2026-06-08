-- ============================================================
-- HỆ THỐNG THÔNG TIN DU LỊCH VIỆT NAM
-- WebGIS + MobileGIS Unified Database Schema
-- Phiên bản: Complete (database.sql + migrations 001–006)
-- Chạy một lần trên database trống (psql -f database_complete.sql)
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- SCHEMA AUTH (migration 005)
-- Chứa: roles, permissions, users, role_permissions,
--        refresh_tokens, blacklist_tokens
-- search_path = public, auth → truy vấn không cần prefi x schema
-- ============================================================

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS vn_units;

-- Áp dụng search_path cho phiên hiện tại (DDL bên dưới hoạt động đúng)
SET search_path TO public, auth, vn_units;

-- Đặt search_path mặc định cho database (thay 'du_lich_ninh_binh' nếu cần)
DO $$
BEGIN
    EXECUTE format(
        'ALTER DATABASE %I SET search_path = public, auth, vn_units',
        current_database()
    );
END;
$$;

-- ============================================================
-- SCHEMA VN_UNITS — Vietnamese administrative units (static data)
-- Không bao giờ thay đổi theo nghiệp vụ nên tách schema riêng.
-- ============================================================

CREATE TABLE IF NOT EXISTS vn_units.administrative_regions (
    id           INTEGER NOT NULL,
    name         VARCHAR(255) NOT NULL,
    name_en      VARCHAR(255) NOT NULL,
    code_name    VARCHAR(255),
    code_name_en VARCHAR(255),
    CONSTRAINT administrative_regions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS vn_units.administrative_units (
    id            INTEGER NOT NULL,
    full_name     VARCHAR(255),
    full_name_en  VARCHAR(255),
    short_name    VARCHAR(255),
    short_name_en VARCHAR(255),
    code_name     VARCHAR(255),
    code_name_en  VARCHAR(255),
    CONSTRAINT administrative_units_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS vn_units.provinces (
    code                   VARCHAR(20) NOT NULL,
    name                   VARCHAR(255) NOT NULL,
    name_en                VARCHAR(255),
    full_name              VARCHAR(255) NOT NULL,
    full_name_en           VARCHAR(255),
    code_name              VARCHAR(255),
    administrative_unit_id INTEGER REFERENCES vn_units.administrative_units(id),
    CONSTRAINT provinces_pkey PRIMARY KEY (code)
);

CREATE INDEX IF NOT EXISTS idx_provinces_unit ON vn_units.provinces(administrative_unit_id);

CREATE TABLE IF NOT EXISTS vn_units.wards (
    code                   VARCHAR(20) NOT NULL,
    name                   VARCHAR(255) NOT NULL,
    name_en                VARCHAR(255),
    full_name              VARCHAR(255),
    full_name_en           VARCHAR(255),
    code_name              VARCHAR(255),
    province_code          VARCHAR(20) REFERENCES vn_units.provinces(code),
    administrative_unit_id INTEGER REFERENCES vn_units.administrative_units(id),
    CONSTRAINT wards_pkey PRIMARY KEY (code)
);

CREATE INDEX IF NOT EXISTS idx_wards_province ON vn_units.wards(province_code);
CREATE INDEX IF NOT EXISTS idx_wards_unit ON vn_units.wards(administrative_unit_id);

-- ============================================================
-- LEVEL 0 – BẢNG ĐỘC LẬP (không có foreign key)
-- ============================================================

-- ── auth schema ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS auth.roles (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    name_vi     VARCHAR(100) NOT NULL,
    name_en     VARCHAR(100),
    description TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth.permissions (
    id              SERIAL PRIMARY KEY,
    resource        VARCHAR(100) NOT NULL,
    action          VARCHAR(50)  NOT NULL,
    name_vi         VARCHAR(255),
    description     TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(resource, action)
);

-- ── public schema ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS spot_categories (
    id          SERIAL PRIMARY KEY,
    parent_id   INTEGER REFERENCES spot_categories(id),
    code        VARCHAR(50) UNIQUE NOT NULL,
    name_vi     VARCHAR(100) NOT NULL,
    name_en     VARCHAR(100),
    icon_url    TEXT,
    color_hex   VARCHAR(7),
    sort_order  INTEGER DEFAULT 0,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS map_categories (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(50) UNIQUE NOT NULL,
    name_vi     VARCHAR(255) NOT NULL,
    name_en     VARCHAR(255),
    description TEXT,
    sort_order  INTEGER DEFAULT 0,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS map_basemaps (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(50) UNIQUE NOT NULL,
    name_vi     VARCHAR(255) NOT NULL,
    name_en     VARCHAR(255),
    provider    VARCHAR(100),
    tile_url    TEXT NOT NULL,
    attribution TEXT,
    min_zoom    INTEGER DEFAULT 0,
    max_zoom    INTEGER DEFAULT 22,
    is_default  BOOLEAN DEFAULT FALSE,
    sort_order  INTEGER DEFAULT 0,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_integrations (
    id               SERIAL PRIMARY KEY,
    provider_code    VARCHAR(50)  NOT NULL UNIQUE,
    provider_name    VARCHAR(255) NOT NULL,
    integration_type VARCHAR(30)  NOT NULL,
    base_url         TEXT,
    auth_type        VARCHAR(30),
    credentials      JSONB,
    webhook_secret   TEXT,
    is_active        BOOLEAN DEFAULT TRUE,
    last_sync_at     TIMESTAMP,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- LEVEL 1 – PHỤ THUỘC VÀO LEVEL 0
-- ============================================================

-- ── auth schema ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS auth.users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id             INTEGER NOT NULL REFERENCES auth.roles(id),
    email               VARCHAR(255) UNIQUE,
    phone               VARCHAR(20),
    password_hash       TEXT,
    full_name           VARCHAR(255),
    avatar_url          TEXT,
    sso_provider        VARCHAR(30),
    sso_uid             VARCHAR(255),
    date_of_birth       DATE,
    gender              VARCHAR(10),
    nationality         VARCHAR(100),
    province_code       VARCHAR(20) REFERENCES vn_units.provinces(code),
    preferred_language  VARCHAR(10) DEFAULT 'vi',
    preferred_currency  VARCHAR(10) DEFAULT 'VND',
    preferred_distance  VARCHAR(10) DEFAULT 'km',
    is_active           BOOLEAN DEFAULT TRUE,
    is_verified         BOOLEAN DEFAULT FALSE,
    two_factor_enabled  BOOLEAN DEFAULT FALSE,
    last_login_at       TIMESTAMP,
    last_login_ip       INET,
    fcm_token           TEXT,
    apns_token          TEXT,
    device_os           VARCHAR(20),
    app_version         VARCHAR(20),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth.role_permissions (
    role_id       INTEGER NOT NULL REFERENCES auth.roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES auth.permissions(id) ON DELETE CASCADE,
    granted_by    UUID REFERENCES auth.users(id),
    granted_at    TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token       TEXT NOT NULL UNIQUE,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP NOT NULL,
    revoked_at  TIMESTAMP,
    last_used   TIMESTAMP,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth.blacklist_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token       TEXT NOT NULL UNIQUE,
    user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    token_type  VARCHAR(20) DEFAULT 'access',
    expires_at  TIMESTAMP NOT NULL,
    reason      VARCHAR(100),
    revoked_at  TIMESTAMP DEFAULT NOW(),
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth.password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth.user_two_factor (
    user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    secret      VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── public schema ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cuisine_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    province_code   VARCHAR(20) REFERENCES vn_units.provinces(code),
    name_vi         VARCHAR(255) NOT NULL,
    name_en         VARCHAR(255),
    category        VARCHAR(50),
    description_vi  TEXT,
    recipe_vi       TEXT,
    cover_image_url TEXT,
    media_urls      TEXT[],
    is_speciality   BOOLEAN DEFAULT FALSE,
    rating_avg      NUMERIC(3,2) DEFAULT 0,
    rating_count    INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_sync_logs (
    id               BIGSERIAL PRIMARY KEY,
    integration_id   INTEGER NOT NULL REFERENCES external_integrations(id) ON DELETE CASCADE,
    job_type         VARCHAR(50),
    status           VARCHAR(20),
    request_payload  JSONB,
    response_payload JSONB,
    error_message    TEXT,
    started_at       TIMESTAMP DEFAULT NOW(),
    finished_at      TIMESTAMP
);

-- ============================================================
-- LEVEL 2 – PHỤ THUỘC VÀO LEVEL 1
-- ============================================================

CREATE TABLE IF NOT EXISTS tourism_spots (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id         INTEGER REFERENCES spot_categories(id),
    province_code       VARCHAR(20) REFERENCES vn_units.provinces(code),
    ward_code           VARCHAR(20) REFERENCES vn_units.wards(code),
    name_vi             VARCHAR(255) NOT NULL,
    name_en             VARCHAR(255),
    slug                VARCHAR(300) UNIQUE,
    description_vi      TEXT,
    description_en      TEXT,
    address_vi          TEXT,
    address_en          TEXT,
    geom                GEOMETRY(POINT, 4326) NOT NULL,
    altitude_m          NUMERIC(8,2),
    opening_hours       JSONB,
    ticket_price_adult  NUMERIC(12,0),
    ticket_price_child  NUMERIC(12,0),
    ticket_currency     VARCHAR(10) DEFAULT 'VND',
    phone               VARCHAR(30),
    email               VARCHAR(255),
    website             TEXT,
    max_capacity        INTEGER,
    alert_threshold_pct INTEGER DEFAULT 80,
    rating_avg          NUMERIC(3,2) DEFAULT 0,
    rating_count        INTEGER DEFAULT 0,
    has_vr_360          BOOLEAN DEFAULT FALSE,
    has_ar_support      BOOLEAN DEFAULT FALSE,
    has_audio_guide     BOOLEAN DEFAULT FALSE,
    qr_code_url         TEXT,
    status              VARCHAR(30) DEFAULT 'active',
    is_featured         BOOLEAN DEFAULT FALSE,
    search_vector       TSVECTOR,
    created_by          UUID REFERENCES auth.users(id),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS businesses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id        UUID REFERENCES auth.users(id),
    province_code   VARCHAR(20) REFERENCES vn_units.provinces(code),
    ward_code       VARCHAR(20) REFERENCES vn_units.wards(code),
    business_name   VARCHAR(255) NOT NULL,
    business_code   VARCHAR(100),
    tax_id          VARCHAR(50),
    license_number  VARCHAR(100),
    business_type   VARCHAR(50),
    description_vi  TEXT,
    description_en  TEXT,
    logo_url        TEXT,
    phone           VARCHAR(30),
    email           VARCHAR(255),
    website         TEXT,
    address_vi      TEXT,
    geom            GEOMETRY(POINT, 4326),
    bank_account    VARCHAR(50),
    bank_name       VARCHAR(100),
    status          VARCHAR(30) DEFAULT 'pending',
    approved_by     UUID REFERENCES auth.users(id),
    approved_at     TIMESTAMP,
    rejection_note  TEXT,
    rating_avg      NUMERIC(3,2) DEFAULT 0,
    rating_count    INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title         VARCHAR(500) NOT NULL,
    slug          VARCHAR(300) NOT NULL UNIQUE,
    author_id     UUID REFERENCES auth.users(id),
    author_name   VARCHAR(255),
    summary       TEXT,
    content       TEXT NOT NULL,
    thumbnail_url TEXT,
    is_published  BOOLEAN DEFAULT FALSE,
    is_featured   BOOLEAN DEFAULT FALSE,
    published_at  TIMESTAMP,
    tags          JSONB DEFAULT '[]'::jsonb,
    view_count    INTEGER DEFAULT 0,
    search_vector TSVECTOR,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS citizen_feedbacks (
    id                           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                      UUID REFERENCES auth.users(id),
    title                        VARCHAR(255) NOT NULL,
    content                      TEXT NOT NULL,
    latitude                     NUMERIC(10,7),
    longitude                    NUMERIC(10,7),
    location_text                TEXT,
    geom                         GEOMETRY(POINT, 4326),
    priority                     VARCHAR(20) DEFAULT 'normal',
    status                       VARCHAR(30) DEFAULT 'pending',
    moderation_status            VARCHAR(30) DEFAULT 'pending',
    images                       JSONB DEFAULT '[]'::jsonb,
    admin_response               TEXT,
    resolution_note              TEXT,
    responded_at                 TIMESTAMP,
    is_location_verified         BOOLEAN DEFAULT FALSE,
    forest_loss_area_estimate_m2 NUMERIC(14,2),
    created_at                   TIMESTAMP DEFAULT NOW(),
    updated_at                   TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_feedback_priority   CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    CONSTRAINT chk_feedback_status     CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    CONSTRAINT chk_feedback_moderation CHECK (moderation_status IN ('pending', 'approved', 'rejected'))
);

CREATE TABLE IF NOT EXISTS api_keys (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(255) NOT NULL,
    key_hash          TEXT NOT NULL UNIQUE,
    issued_to_user_id UUID REFERENCES auth.users(id),
    status            VARCHAR(20) DEFAULT 'active',
    expires_at        TIMESTAMP,
    revoked_at        TIMESTAMP,
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offline_downloads (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES auth.users(id),
    area_name       VARCHAR(255) NOT NULL,
    province_code   VARCHAR(20) REFERENCES vn_units.provinces(code),
    geom_bounds     GEOMETRY(POLYGON, 4326) NOT NULL,
    zoom_min        INTEGER DEFAULT 10,
    zoom_max        INTEGER DEFAULT 16,
    size_mb         NUMERIC(8,2),
    tile_count      INTEGER,
    downloaded_at   TIMESTAMP DEFAULT NOW(),
    data_version    DATE,
    last_updated_at TIMESTAMP,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS report_schedules (
    id              SERIAL PRIMARY KEY,
    created_by      UUID REFERENCES auth.users(id),
    target_role     INTEGER REFERENCES auth.roles(id),
    report_type     VARCHAR(50),
    frequency       VARCHAR(20),
    next_run_at     TIMESTAMP,
    last_run_at     TIMESTAMP,
    delivery_method VARCHAR(20),
    recipients      TEXT[],
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS map_layers (
    id                 SERIAL PRIMARY KEY,
    category_id        INTEGER REFERENCES map_categories(id),
    code               VARCHAR(100) UNIQUE NOT NULL,
    name_vi            VARCHAR(255) NOT NULL,
    name_en            VARCHAR(255),
    layer_type         VARCHAR(30) NOT NULL,
    source_url         TEXT,
    style_json         JSONB,
    min_zoom           INTEGER DEFAULT 0,
    max_zoom           INTEGER DEFAULT 22,
    is_default_visible BOOLEAN DEFAULT TRUE,
    sort_order         INTEGER DEFAULT 0,
    status             VARCHAR(20) DEFAULT 'active',
    created_by         UUID REFERENCES auth.users(id),
    created_at         TIMESTAMP DEFAULT NOW(),
    updated_at         TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID REFERENCES auth.users(id),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id   TEXT,
    old_value   JSONB,
    new_value   JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID REFERENCES auth.users(id),
    target_roles    INTEGER[],
    target_geom     GEOMETRY(POINT, 4326),
    target_radius_m INTEGER,
    type            VARCHAR(50) NOT NULL,
    title_vi        VARCHAR(255) NOT NULL,
    body_vi         TEXT,
    data            JSONB,
    sent_at         TIMESTAMP,
    delivery_status VARCHAR(20) DEFAULT 'pending',
    read_at         TIMESTAMP,
    triggered_by    VARCHAR(100),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gps_tracks (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES auth.users(id),
    track_type        VARCHAR(30),
    started_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at          TIMESTAMP,
    total_distance_m  NUMERIC(10,2),
    geom_line         GEOMETRY(LINESTRING, 4326),
    is_synced         BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- LEVEL 3 – PHỤ THUỘC VÀO LEVEL 2
-- ============================================================

CREATE TABLE IF NOT EXISTS spot_media (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spot_id       UUID NOT NULL REFERENCES tourism_spots(id) ON DELETE CASCADE,
    media_type    VARCHAR(30) NOT NULL,
    url           TEXT NOT NULL,
    thumbnail_url TEXT,
    title_vi      VARCHAR(255),
    title_en      VARCHAR(255),
    duration_sec  INTEGER,
    file_size_kb  INTEGER,
    resolution    VARCHAR(20),
    is_primary    BOOLEAN DEFAULT FALSE,
    sort_order    INTEGER DEFAULT 0,
    language      VARCHAR(10),
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aframe_scenes (
    id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spot_id                    UUID NOT NULL REFERENCES tourism_spots(id) ON DELETE CASCADE,
    legacy_media_id            UUID UNIQUE REFERENCES spot_media(id) ON DELETE SET NULL,
    name                       VARCHAR(200),
    description                TEXT,
    equirectangular_image_url  TEXT NOT NULL,
    thumbnail_url              TEXT,
    camera_position            JSONB DEFAULT '{"x":0,"y":1.6,"z":0}'::jsonb,
    camera_rotation            JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
    camera_fov                 NUMERIC(5,2) DEFAULT 80,
    fog_settings               JSONB,
    ambient_sound_url          TEXT,
    ambient_sound_loop         BOOLEAN DEFAULT TRUE,
    ambient_sound_volume       NUMERIC(3,2) DEFAULT 0.5,
    narration_audio_url        TEXT,
    auto_play_narration        BOOLEAN DEFAULT FALSE,
    is_main                    BOOLEAN DEFAULT FALSE,
    is_active                  BOOLEAN DEFAULT TRUE,
    created_by                 UUID REFERENCES auth.users(id),
    created_at                 TIMESTAMP DEFAULT NOW(),
    updated_at                 TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_aframe_scenes_one_main_per_spot
    ON aframe_scenes (spot_id)
    WHERE is_main = TRUE;

CREATE INDEX IF NOT EXISTS idx_aframe_scenes_spot_active
    ON aframe_scenes (spot_id, is_active, is_main);

CREATE TABLE IF NOT EXISTS capacity_logs (
    id            BIGSERIAL PRIMARY KEY,
    spot_id       UUID NOT NULL REFERENCES tourism_spots(id),
    recorded_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    visitor_count INTEGER NOT NULL,
    capacity_pct  NUMERIC(5,2),
    status        VARCHAR(20),
    data_source   VARCHAR(50),
    recorded_by   UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS capacity_alert_configs (
    id             SERIAL PRIMARY KEY,
    spot_id        UUID REFERENCES tourism_spots(id),
    province_code  VARCHAR(20) REFERENCES vn_units.provinces(code),
    threshold_busy INTEGER DEFAULT 70,
    threshold_near INTEGER DEFAULT 85,
    threshold_over INTEGER DEFAULT 100,
    notify_roles   INTEGER[],
    is_active      BOOLEAN DEFAULT TRUE,
    updated_by     UUID REFERENCES auth.users(id),
    updated_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES businesses(id),
    spot_id         UUID REFERENCES tourism_spots(id),
    service_name_vi VARCHAR(255) NOT NULL,
    service_name_en VARCHAR(255),
    category        VARCHAR(50),
    description_vi  TEXT,
    price_from      NUMERIC(15,0),
    price_to        NUMERIC(15,0),
    currency        VARCHAR(10) DEFAULT 'VND',
    unit            VARCHAR(50),
    booking_url     TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vouchers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES businesses(id),
    code            VARCHAR(50) UNIQUE NOT NULL,
    title_vi        VARCHAR(255),
    description_vi  TEXT,
    discount_type   VARCHAR(20),
    discount_value  NUMERIC(12,2),
    min_order_value NUMERIC(12,0),
    max_uses        INTEGER,
    used_count      INTEGER DEFAULT 0,
    valid_from      TIMESTAMP,
    valid_until     TIMESTAMP,
    geo_target_geom GEOMETRY(POINT, 4326),
    geo_radius_m    INTEGER,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID REFERENCES auth.users(id),
    spot_id          UUID REFERENCES tourism_spots(id),
    business_id      UUID REFERENCES businesses(id),
    stars            SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
    title            VARCHAR(255),
    content          TEXT,
    pros             TEXT,
    cons             TEXT,
    visit_date       DATE,
    photo_urls       TEXT[],
    status           VARCHAR(20) DEFAULT 'published',
    is_verified_visit BOOLEAN DEFAULT FALSE,
    helpful_count    INTEGER DEFAULT 0,
    reply_text       TEXT,
    reply_by         UUID REFERENCES auth.users(id),
    reply_at         TIMESTAMP,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW(),
    CONSTRAINT ratings_target CHECK (
        (spot_id IS NOT NULL AND business_id IS NULL) OR
        (spot_id IS NULL AND business_id IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS itineraries (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              UUID NOT NULL REFERENCES auth.users(id),
    title                VARCHAR(255) NOT NULL,
    description          TEXT,
    start_date           DATE,
    end_date             DATE,
    total_days           INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
    budget_vnd           NUMERIC(15,0),
    is_public            BOOLEAN DEFAULT FALSE,
    share_token          VARCHAR(100) UNIQUE,
    total_distance_km    NUMERIC(8,2),
    est_travel_time_min  INTEGER,
    status               VARCHAR(20) DEFAULT 'draft',
    ai_generated         BOOLEAN DEFAULT FALSE,
    ai_prompt            TEXT,
    pdf_export_url       TEXT,
    created_at           TIMESTAMP DEFAULT NOW(),
    updated_at           TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vlogs (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES auth.users(id),
    title             VARCHAR(500),
    content           TEXT,
    excerpt           TEXT,
    cover_image_url   TEXT,
    media_urls        TEXT[],
    video_url         TEXT,
    video_duration_sec INTEGER,
    geom              GEOMETRY(POINT, 4326),
    spot_id           UUID REFERENCES tourism_spots(id),
    province_code     VARCHAR(20) REFERENCES vn_units.provinces(code),
    view_count        INTEGER DEFAULT 0,
    like_count        INTEGER DEFAULT 0,
    comment_count     INTEGER DEFAULT 0,
    save_count        INTEGER DEFAULT 0,
    status            VARCHAR(20) DEFAULT 'pending',
    moderated_by      UUID REFERENCES auth.users(id),
    moderated_at      TIMESTAMP,
    rejection_note    TEXT,
    platform          VARCHAR(20) DEFAULT 'web',
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS festivals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    province_code   VARCHAR(20) REFERENCES vn_units.provinces(code),
    spot_id         UUID REFERENCES tourism_spots(id),
    name_vi         VARCHAR(255) NOT NULL,
    name_en         VARCHAR(255),
    festival_type   VARCHAR(50),
    description_vi  TEXT,
    start_date      DATE NOT NULL,
    end_date        DATE,
    is_recurring    BOOLEAN DEFAULT FALSE,
    recurrence_rule VARCHAR(100),
    geom            GEOMETRY(POINT, 4326),
    cover_image_url TEXT,
    website         TEXT,
    is_published    BOOLEAN DEFAULT TRUE,
    location_name   VARCHAR(255),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ocop_products (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id      UUID REFERENCES businesses(id),
    spot_id          UUID REFERENCES tourism_spots(id) ON DELETE SET NULL,
    province_code    VARCHAR(20) NOT NULL REFERENCES vn_units.provinces(code),
    name_vi          VARCHAR(255) NOT NULL,
    name_en          VARCHAR(255),
    category         VARCHAR(50),
    description_vi   TEXT,
    star_rating      SMALLINT CHECK (star_rating BETWEEN 3 AND 5),
    certification_no VARCHAR(100),
    certified_at     DATE,
    cover_image_url  TEXT,
    media_urls       TEXT[],
    price_vnd        NUMERIC(12,0),
    unit             VARCHAR(50),
    shop_url         TEXT,
    geom             GEOMETRY(POINT, 4326),
    qr_code_url      TEXT,
    is_active        BOOLEAN DEFAULT TRUE,
    producer_name    VARCHAR(255),
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field_reports (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reported_by        UUID NOT NULL REFERENCES auth.users(id),
    spot_id            UUID REFERENCES tourism_spots(id),
    report_type        VARCHAR(50),
    severity           VARCHAR(20),
    title              VARCHAR(255),
    description        TEXT,
    geom               GEOMETRY(POINT, 4326) NOT NULL,
    photo_urls         TEXT[],
    audio_note_url     TEXT,
    status             VARCHAR(30) DEFAULT 'open',
    assigned_to        UUID REFERENCES auth.users(id),
    resolution_note    TEXT,
    resolved_at        TIMESTAMP,
    is_offline_created BOOLEAN DEFAULT FALSE,
    synced_at          TIMESTAMP,
    created_at         TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ar_sessions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES auth.users(id),
    spot_id     UUID REFERENCES tourism_spots(id),
    ar_type     VARCHAR(30),
    geom_start  GEOMETRY(POINT, 4326),
    started_at  TIMESTAMP DEFAULT NOW(),
    duration_sec INTEGER,
    qr_scanned  BOOLEAN DEFAULT FALSE,
    spots_viewed UUID[],
    device_os   VARCHAR(20),
    app_version VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS user_visit_history (
    id         BIGSERIAL PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES auth.users(id),
    spot_id    UUID REFERENCES tourism_spots(id),
    visited_at TIMESTAMP DEFAULT NOW(),
    platform   VARCHAR(20),
    geom       GEOMETRY(POINT, 4326),
    source     VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS generated_reports (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id  INTEGER REFERENCES report_schedules(id),
    created_by   UUID REFERENCES auth.users(id),
    report_type  VARCHAR(50),
    period_from  DATE,
    period_to    DATE,
    title        VARCHAR(255),
    file_url     TEXT,
    file_format  VARCHAR(10),
    file_size_kb INTEGER,
    sent_to_roles INTEGER[],
    generated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news_comments (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    news_id           UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    user_id           UUID REFERENCES auth.users(id),
    parent_comment_id UUID REFERENCES news_comments(id) ON DELETE CASCADE,
    content           TEXT NOT NULL,
    user_name         VARCHAR(255),
    user_email        VARCHAR(255),
    is_approved       BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS map_layer_apis (
    id           SERIAL PRIMARY KEY,
    category_id  INTEGER REFERENCES map_categories(id),
    map_layer_id INTEGER REFERENCES map_layers(id),
    name         VARCHAR(255) NOT NULL,
    slug         VARCHAR(255) UNIQUE NOT NULL,
    description  TEXT,
    endpoint_url TEXT NOT NULL,
    http_method  VARCHAR(10) DEFAULT 'GET',
    status       VARCHAR(20) DEFAULT 'draft',
    published_at TIMESTAMP,
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tour_packages (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id       UUID REFERENCES businesses(id),
    province_code     VARCHAR(20) REFERENCES vn_units.provinces(code),
    name_vi           VARCHAR(255) NOT NULL,
    name_en           VARCHAR(255),
    slug              VARCHAR(300) UNIQUE,
    description_vi    TEXT,
    duration_days     INTEGER,
    price_from_vnd    NUMERIC(15,0),
    max_guests        INTEGER,
    includes          JSONB,
    excludes          JSONB,
    start_location_vi VARCHAR(255),
    end_location_vi   VARCHAR(255),
    cover_image_url   TEXT,
    rating_avg        NUMERIC(3,2) DEFAULT 0,
    rating_count      INTEGER DEFAULT 0,
    status            VARCHAR(20) DEFAULT 'draft',
    is_featured       BOOLEAN DEFAULT FALSE,
    published_at      TIMESTAMP,
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_activity_reports (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    report_period     VARCHAR(20) NOT NULL,
    period_from       DATE NOT NULL,
    period_to         DATE NOT NULL,
    total_revenue_vnd NUMERIC(18,0) DEFAULT 0,
    total_bookings    INTEGER DEFAULT 0,
    total_visitors    INTEGER DEFAULT 0,
    avg_capacity_pct  NUMERIC(5,2),
    notes             TEXT,
    status            VARCHAR(20) DEFAULT 'submitted',
    submitted_by      UUID REFERENCES auth.users(id),
    reviewed_by       UUID REFERENCES auth.users(id),
    reviewed_at       TIMESTAMP,
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_business_report_period     CHECK (report_period IN ('month', 'quarter', 'year', 'custom')),
    CONSTRAINT chk_business_report_status     CHECK (status IN ('submitted', 'reviewed', 'approved', 'rejected')),
    CONSTRAINT chk_business_report_date_range CHECK (period_to >= period_from)
);

-- ── Chatbot AI (migration 003) ───────────────────────────────

CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_type    VARCHAR(30) NOT NULL DEFAULT 'tourist',
    language        VARCHAR(10) DEFAULT 'vi',
    context         JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    last_message_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id          BIGSERIAL PRIMARY KEY,
    session_id  UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL,
    content     TEXT NOT NULL,
    map_actions JSONB,
    token_usage JSONB,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- LEVEL 4 – PHỤ THUỘC VÀO LEVEL 3
-- ============================================================

CREATE TABLE IF NOT EXISTS vr_hotspots (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id       UUID NOT NULL REFERENCES spot_media(id) ON DELETE CASCADE,
    linked_spot_id UUID REFERENCES tourism_spots(id),
    pitch          NUMERIC(6,2),
    yaw            NUMERIC(6,2),
    label_vi       VARCHAR(200),
    label_en       VARCHAR(200),
    icon_type      VARCHAR(30),
    target_url     TEXT,
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aframe_hotspots (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scene_id          UUID NOT NULL REFERENCES aframe_scenes(id) ON DELETE CASCADE,
    legacy_hotspot_id UUID UNIQUE REFERENCES vr_hotspots(id) ON DELETE SET NULL,
    name              VARCHAR(100),
    description       TEXT,
    hotspot_type      VARCHAR(30) DEFAULT 'info',
    position          JSONB NOT NULL,
    scale             JSONB DEFAULT '{"x":1,"y":1,"z":1}'::jsonb,
    target_scene_id   UUID REFERENCES aframe_scenes(id) ON DELETE SET NULL,
    linked_spot_id    UUID REFERENCES tourism_spots(id) ON DELETE SET NULL,
    target_url        TEXT,
    icon_type         VARCHAR(30),
    visible           BOOLEAN DEFAULT TRUE,
    is_active         BOOLEAN DEFAULT TRUE,
    created_by        UUID REFERENCES auth.users(id),
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aframe_hotspots_scene_active
    ON aframe_hotspots (scene_id, is_active, visible);

CREATE INDEX IF NOT EXISTS idx_aframe_hotspots_target_scene
    ON aframe_hotspots (target_scene_id);

CREATE TABLE IF NOT EXISTS itinerary_days (
    id           SERIAL PRIMARY KEY,
    itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    day_number   INTEGER NOT NULL,
    title        VARCHAR(255),
    date_actual  DATE,
    notes        TEXT
);

CREATE TABLE IF NOT EXISTS vlog_comments (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vlog_id    UUID NOT NULL REFERENCES vlogs(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES auth.users(id),
    parent_id  UUID REFERENCES vlog_comments(id),
    content    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vlog_likes (
    id         BIGSERIAL PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vlog_id    UUID NOT NULL REFERENCES vlogs(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, vlog_id)
);

CREATE TABLE IF NOT EXISTS user_saves (
    id         BIGSERIAL PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES auth.users(id),
    spot_id    UUID REFERENCES tourism_spots(id),
    vlog_id    UUID REFERENCES vlogs(id),
    category   VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, spot_id),
    UNIQUE(user_id, vlog_id)
);

CREATE TABLE IF NOT EXISTS gps_track_points (
    id          BIGSERIAL PRIMARY KEY,
    track_id    UUID NOT NULL REFERENCES gps_tracks(id) ON DELETE CASCADE,
    geom        GEOMETRY(POINT, 4326) NOT NULL,
    altitude_m  NUMERIC(8,2),
    speed_kmh   NUMERIC(6,2),
    accuracy_m  NUMERIC(6,2),
    battery_pct SMALLINT,
    recorded_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS map_layer_api_permissions (
    id               BIGSERIAL PRIMARY KEY,
    map_layer_api_id INTEGER NOT NULL REFERENCES map_layer_apis(id) ON DELETE CASCADE,
    principal_type   VARCHAR(20) NOT NULL,
    user_id          UUID REFERENCES auth.users(id),
    role_id          INTEGER REFERENCES auth.roles(id),
    can_view         BOOLEAN DEFAULT TRUE,
    can_edit         BOOLEAN DEFAULT FALSE,
    can_delete       BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_map_layer_api_principal CHECK (
        (principal_type = 'public' AND user_id IS NULL AND role_id IS NULL) OR
        (principal_type = 'user'   AND user_id IS NOT NULL AND role_id IS NULL) OR
        (principal_type = 'role'   AND role_id IS NOT NULL AND user_id IS NULL)
    )
);

CREATE TABLE IF NOT EXISTS api_key_map_layer_apis (
    api_key_id       INTEGER NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    map_layer_api_id INTEGER NOT NULL REFERENCES map_layer_apis(id) ON DELETE CASCADE,
    created_at       TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (api_key_id, map_layer_api_id)
);

CREATE TABLE IF NOT EXISTS api_key_usage_logs (
    id               BIGSERIAL PRIMARY KEY,
    api_key_id       INTEGER REFERENCES api_keys(id) ON DELETE SET NULL,
    map_layer_api_id INTEGER REFERENCES map_layer_apis(id) ON DELETE SET NULL,
    request_path     TEXT,
    http_method      VARCHAR(10),
    status_code      INTEGER,
    response_time_ms INTEGER,
    request_ip       INET,
    requested_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tour_package_stops (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_package_id      UUID NOT NULL REFERENCES tour_packages(id) ON DELETE CASCADE,
    day_number           INTEGER NOT NULL,
    stop_order           INTEGER NOT NULL,
    spot_id              UUID REFERENCES tourism_spots(id),
    business_id          UUID REFERENCES businesses(id),
    title_vi             VARCHAR(255),
    description_vi       TEXT,
    planned_duration_min INTEGER,
    geom                 GEOMETRY(POINT, 4326),
    CONSTRAINT uidx_tour_stop UNIQUE (tour_package_id, day_number, stop_order)
);

-- ============================================================
-- LEVEL 5 – PHỤ THUỘC VÀO LEVEL 4
-- ============================================================

CREATE TABLE IF NOT EXISTS itinerary_stops (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_id               INTEGER NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
    spot_id              UUID REFERENCES tourism_spots(id),
    business_id          UUID REFERENCES businesses(id),
    custom_name          VARCHAR(255),
    custom_geom          GEOMETRY(POINT, 4326),
    sort_order           INTEGER NOT NULL,
    planned_arrival      TIME,
    planned_duration_min INTEGER,
    notes                TEXT,
    is_completed         BOOLEAN DEFAULT FALSE,
    completed_at         TIMESTAMP
);

-- ============================================================
-- INDEXES – auth schema
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_role  ON auth.users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_users_sso   ON auth.users(sso_provider, sso_uid);
CREATE INDEX IF NOT EXISTS idx_users_province_code ON auth.users(province_code);
CREATE INDEX IF NOT EXISTS idx_users_active ON auth.users(id) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user    ON auth.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON auth.refresh_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_blacklist_tokens_user    ON auth.blacklist_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_tokens_expires ON auth.blacklist_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON auth.password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_prt_user_id    ON auth.password_reset_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON auth.role_permissions(permission_id);

-- ============================================================
-- INDEXES – public schema (base + migration 001)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_spots_geom     ON tourism_spots USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_spots_province ON tourism_spots(province_code);
CREATE INDEX IF NOT EXISTS idx_spots_category ON tourism_spots(category_id);
CREATE INDEX IF NOT EXISTS idx_spots_status   ON tourism_spots(status);
CREATE INDEX IF NOT EXISTS idx_spots_featured ON tourism_spots(is_featured);
CREATE INDEX IF NOT EXISTS idx_spots_fts      ON tourism_spots USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_spots_slug     ON tourism_spots(slug);
CREATE INDEX IF NOT EXISTS idx_spots_active   ON tourism_spots(province_code) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_spot_media_spot ON spot_media(spot_id);
CREATE INDEX IF NOT EXISTS idx_spot_media_type ON spot_media(media_type);

CREATE INDEX IF NOT EXISTS idx_capacity_spot      ON capacity_logs(spot_id);
CREATE INDEX IF NOT EXISTS idx_capacity_time      ON capacity_logs(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_capacity_spot_time ON capacity_logs(spot_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_capacity_latest_by_spot
    ON capacity_logs(spot_id, recorded_at DESC)
    INCLUDE (visitor_count, capacity_pct, status);

CREATE INDEX IF NOT EXISTS idx_businesses_geom     ON businesses USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_businesses_province ON businesses(province_code);
CREATE INDEX IF NOT EXISTS idx_businesses_status   ON businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_owner    ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_approved ON businesses(province_code) WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_ratings_spot     ON ratings(spot_id);
CREATE INDEX IF NOT EXISTS idx_ratings_business ON ratings(business_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user     ON ratings(user_id);

CREATE INDEX IF NOT EXISTS idx_itineraries_user ON itineraries(user_id);

CREATE INDEX IF NOT EXISTS idx_itinerary_days_itin ON itinerary_days(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_stops_day ON itinerary_stops(day_id);

CREATE INDEX IF NOT EXISTS idx_vlogs_user    ON vlogs(user_id);
CREATE INDEX IF NOT EXISTS idx_vlogs_spot    ON vlogs(spot_id);
CREATE INDEX IF NOT EXISTS idx_vlogs_geom    ON vlogs USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_vlogs_status  ON vlogs(status);

CREATE INDEX IF NOT EXISTS idx_vlog_likes_user ON vlog_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_vlog_likes_vlog ON vlog_likes(vlog_id);

CREATE INDEX IF NOT EXISTS idx_vlog_comments_vlog ON vlog_comments(vlog_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_saves_user ON user_saves(user_id, category);

CREATE INDEX IF NOT EXISTS idx_festivals_date     ON festivals(start_date);
CREATE INDEX IF NOT EXISTS idx_festivals_province ON festivals(province_code);

CREATE INDEX IF NOT EXISTS idx_ocop_province ON ocop_products(province_code);
CREATE INDEX IF NOT EXISTS idx_ocop_stars    ON ocop_products(star_rating);
CREATE INDEX IF NOT EXISTS idx_ocop_active   ON ocop_products(id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_ocop_spot      ON ocop_products(spot_id);

CREATE INDEX IF NOT EXISTS idx_notif_user   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_type   ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notif_geom   ON notifications USING GIST(target_geom);
CREATE INDEX IF NOT EXISTS idx_notif_status ON notifications(delivery_status, sent_at);
CREATE INDEX IF NOT EXISTS idx_notifications_pending_delivery
    ON notifications(delivery_status, created_at ASC)
    WHERE delivery_status = 'pending' AND user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications(user_id, created_at DESC)
    WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_offline_user ON offline_downloads(user_id);

CREATE INDEX IF NOT EXISTS idx_gps_points_track ON gps_track_points(track_id);
CREATE INDEX IF NOT EXISTS idx_gps_points_geom  ON gps_track_points USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_gps_points_time  ON gps_track_points(recorded_at);

CREATE INDEX IF NOT EXISTS idx_field_reports_geom   ON field_reports USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_field_reports_status ON field_reports(status);
CREATE INDEX IF NOT EXISTS idx_field_reports_type   ON field_reports(report_type);

CREATE INDEX IF NOT EXISTS idx_visit_history_user    ON user_visit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_visit_history_spot    ON user_visit_history(spot_id);
CREATE INDEX IF NOT EXISTS idx_visit_history_visited ON user_visit_history(visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_user   ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_time   ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_slug      ON news(slug);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_featured  ON news(is_featured);
CREATE INDEX IF NOT EXISTS idx_news_tags      ON news USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_news_search_vector ON news USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_news_comments_news        ON news_comments(news_id, created_at);
CREATE INDEX IF NOT EXISTS idx_news_comments_parent      ON news_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_news_comments_user        ON news_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_news_comments_is_approved ON news_comments(is_approved);

CREATE INDEX IF NOT EXISTS idx_feedback_user     ON citizen_feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status   ON citizen_feedbacks(status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON citizen_feedbacks(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_created  ON citizen_feedbacks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_geom     ON citizen_feedbacks USING GIST(geom);

CREATE INDEX IF NOT EXISTS idx_map_layers_category ON map_layers(category_id);
CREATE INDEX IF NOT EXISTS idx_map_layers_status   ON map_layers(status);

CREATE INDEX IF NOT EXISTS idx_map_layer_apis_category ON map_layer_apis(category_id);
CREATE INDEX IF NOT EXISTS idx_map_layer_apis_layer    ON map_layer_apis(map_layer_id);
CREATE INDEX IF NOT EXISTS idx_map_layer_apis_status   ON map_layer_apis(status);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_map_layer_api_permission
    ON map_layer_api_permissions(
        map_layer_api_id,
        principal_type,
        COALESCE(user_id::text, ''),
        COALESCE(role_id::text, '')
    );

CREATE INDEX IF NOT EXISTS idx_api_keys_status  ON api_keys(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires ON api_keys(expires_at);

CREATE INDEX IF NOT EXISTS idx_api_usage_api_key ON api_key_usage_logs(api_key_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_tour_packages_business ON tour_packages(business_id);
CREATE INDEX IF NOT EXISTS idx_tour_packages_province ON tour_packages(province_code);
CREATE INDEX IF NOT EXISTS idx_tour_packages_status   ON tour_packages(status, is_featured);

CREATE INDEX IF NOT EXISTS idx_tour_stops_tour ON tour_package_stops(tour_package_id, day_number, stop_order);
CREATE INDEX IF NOT EXISTS idx_tour_stops_geom ON tour_package_stops USING GIST(geom);

CREATE INDEX IF NOT EXISTS idx_services_business ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_services_spot     ON services(spot_id);

CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_integration
    ON integration_sync_logs(integration_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_business_reports_business ON business_activity_reports(business_id);
CREATE INDEX IF NOT EXISTS idx_business_reports_period   ON business_activity_reports(period_from, period_to);
CREATE INDEX IF NOT EXISTS idx_business_reports_status   ON business_activity_reports(status);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user    ON ai_chat_sessions(user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON ai_chat_messages(session_id, created_at);

-- ============================================================
-- VIEWS
-- ============================================================

CREATE OR REPLACE VIEW v_current_capacity AS
SELECT
    ts.id AS spot_id,
    ts.name_vi,
    cl.visitor_count,
    cl.capacity_pct,
    cl.status,
    cl.recorded_at,
    ts.max_capacity,
    ST_AsGeoJSON(ts.geom)::jsonb AS geojson
FROM tourism_spots ts
LEFT JOIN LATERAL (
    SELECT
        visitor_count,
        capacity_pct,
        status,
        recorded_at
    FROM capacity_logs cl
    WHERE cl.spot_id = ts.id
    ORDER BY cl.recorded_at DESC
    LIMIT 1
) cl ON TRUE;

CREATE OR REPLACE VIEW v_spots_full AS
SELECT
    ts.*,
    sc.name_vi           AS category_name,
    sc.color_hex         AS category_color,
    sc.icon_url          AS category_icon,
    p.name               AS province_name,
    ST_X(ts.geom)        AS longitude,
    ST_Y(ts.geom)        AS latitude,
    ST_AsGeoJSON(ts.geom)::jsonb AS geojson
FROM tourism_spots ts
LEFT JOIN spot_categories sc ON ts.category_id = sc.id
LEFT JOIN vn_units.provinces p ON ts.province_code = p.code;

CREATE OR REPLACE VIEW v_province_stats AS
SELECT
    p.code                                             AS province_code,
    p.name                                             AS province_name,
    COUNT(ts.id)                                       AS spot_count,
    COUNT(ts.id) FILTER (WHERE ts.is_featured)         AS featured_count,
    COUNT(b.id)                                        AS business_count,
    ROUND(AVG(ts.rating_avg), 2)                       AS avg_rating
FROM vn_units.provinces p
LEFT JOIN tourism_spots ts ON ts.province_code = p.code AND ts.status = 'active'
LEFT JOIN businesses b    ON b.province_code   = p.code AND b.status  = 'approved'
GROUP BY p.code, p.name;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- auth schema triggers
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- public schema triggers
CREATE TRIGGER trg_spots_updated_at
    BEFORE UPDATE ON tourism_spots
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_itineraries_updated_at
    BEFORE UPDATE ON itineraries
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_vlogs_updated_at
    BEFORE UPDATE ON vlogs
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_festivals_updated_at
    BEFORE UPDATE ON festivals
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_ocop_updated_at
    BEFORE UPDATE ON ocop_products
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_news_updated_at
    BEFORE UPDATE ON news
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_news_comments_updated_at
    BEFORE UPDATE ON news_comments
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_feedbacks_updated_at
    BEFORE UPDATE ON citizen_feedbacks
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_map_layers_updated_at
    BEFORE UPDATE ON map_layers
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_map_layer_apis_updated_at
    BEFORE UPDATE ON map_layer_apis
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_tours_updated_at
    BEFORE UPDATE ON tour_packages
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_integrations_updated_at
    BEFORE UPDATE ON external_integrations
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_business_reports_updated_at
    BEFORE UPDATE ON business_activity_reports
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- Auto-set geometry from lat/lng on citizen_feedbacks
CREATE OR REPLACE FUNCTION trg_set_feedback_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL THEN
        NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_feedback_geom
    BEFORE INSERT OR UPDATE ON citizen_feedbacks
    FOR EACH ROW EXECUTE FUNCTION trg_set_feedback_geom();

-- Auto-update tourism_spots rating aggregates
CREATE OR REPLACE FUNCTION trg_update_spot_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tourism_spots
    SET
        rating_avg   = (SELECT ROUND(AVG(stars)::numeric, 2) FROM ratings
                        WHERE spot_id = COALESCE(NEW.spot_id, OLD.spot_id) AND status = 'published'),
        rating_count = (SELECT COUNT(*) FROM ratings
                        WHERE spot_id = COALESCE(NEW.spot_id, OLD.spot_id) AND status = 'published')
    WHERE id = COALESCE(NEW.spot_id, OLD.spot_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_spot_rating_insert
    AFTER INSERT OR UPDATE OR DELETE ON ratings
    FOR EACH ROW EXECUTE FUNCTION trg_update_spot_rating();

-- Auto-calculate capacity percentage
CREATE OR REPLACE FUNCTION trg_calc_capacity_pct()
RETURNS TRIGGER AS $$
DECLARE v_max INTEGER;
BEGIN
    SELECT max_capacity INTO v_max FROM tourism_spots WHERE id = NEW.spot_id;
    IF v_max IS NOT NULL AND v_max > 0 THEN
        NEW.capacity_pct := ROUND((NEW.visitor_count::numeric / v_max) * 100, 2);
        NEW.status := CASE
            WHEN NEW.capacity_pct >= 100 THEN 'overloaded'
            WHEN NEW.capacity_pct >= 85  THEN 'near_full'
            WHEN NEW.capacity_pct >= 60  THEN 'busy'
            ELSE 'normal'
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_capacity_calc
    BEFORE INSERT ON capacity_logs
    FOR EACH ROW EXECUTE FUNCTION trg_calc_capacity_pct();

-- Full-text search: tourism_spots
CREATE OR REPLACE FUNCTION trg_update_spot_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', COALESCE(NEW.name_vi, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.name_en, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.description_vi, '')), 'C') ||
        setweight(to_tsvector('simple', COALESCE(NEW.address_vi, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_spot_search_vector
    BEFORE INSERT OR UPDATE ON tourism_spots
    FOR EACH ROW EXECUTE FUNCTION trg_update_spot_search_vector();

-- Full-text search: news
CREATE OR REPLACE FUNCTION trg_update_news_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.summary, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.content, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_news_search_vector
    BEFORE INSERT OR UPDATE ON news
    FOR EACH ROW EXECUTE FUNCTION trg_update_news_search_vector();

-- ============================================================
-- SEED DATA – Roles (migration 004 + 006 final version)
-- ============================================================

INSERT INTO auth.roles (code, name_vi, name_en, description)
VALUES
    (
        'system_admin',
        'Quản trị hệ thống',
        'System Administrator',
        'Toàn quyền hệ thống: quản lý người dùng, cấu hình, dữ liệu'
    ),
    (
        'ministry_manager',
        'Bộ Văn hóa Thể thao và Du lịch',
        'Ministry of Culture, Sports and Tourism',
        'Quản lý cấp Bộ: hoạch định chính sách, phê duyệt toàn quốc'
    ),
    (
        'department_manager',
        'Sở Văn hóa Thể thao và Du lịch',
        'Department of Culture, Sports and Tourism',
        'Quản lý cấp Sở: giám sát và phê duyệt trong phạm vi tỉnh'
    ),
    (
        'spot_operator',
        'Đơn vị vận hành điểm du lịch',
        'Tourism Spot Operator',
        'Quản lý và vận hành điểm du lịch: cập nhật thông tin, sức chứa, sự kiện'
    ),
    (
        'travel_company',
        'Công ty lữ hành',
        'Travel Company',
        'Cung cấp và quản lý tour, lịch trình, đặt chỗ cho khách'
    ),
    (
        'service_provider',
        'Đơn vị cung cấp dịch vụ du lịch',
        'Tourism Service Provider',
        'Nhà hàng, khách sạn, cho thuê xe, dịch vụ lưu trú và ẩm thực'
    ),
    (
        'tourist',
        'Khách du lịch',
        'Tourist',
        'Người dùng cuối: tìm kiếm, đặt dịch vụ, viết review, lưu hành trình'
    )
ON CONFLICT (code) DO UPDATE SET
    name_vi     = EXCLUDED.name_vi,
    name_en     = EXCLUDED.name_en,
    description = EXCLUDED.description;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
