-- 创建 l1nker_user 表
CREATE TABLE l1nker_user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    managed_projects TEXT DEFAULT '*',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(255) DEFAULT 'user',
    email VARCHAR(255) DEFAULT '',
    last_password_change DATETIME,
    two_factor_secret TEXT
);

-- 创建 user_roles 表
CREATE TABLE user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name VARCHAR UNIQUE,
    is_system_role INTEGER DEFAULT 0
);

-- 创建 user_role_assignment 表
CREATE TABLE user_role_assignment (
    user_id INTEGER,
    role_id INTEGER,
    scope VARCHAR,
    scope_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES l1nker_user(id),
    FOREIGN KEY (role_id) REFERENCES user_roles(id)
);

-- 创建 sso_providers 表
CREATE TABLE sso_providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR UNIQUE
);

-- 创建 sso_users 表
CREATE TABLE sso_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    provider_id INTEGER,
    provider_user_id VARCHAR UNIQUE,
    FOREIGN KEY (user_id) REFERENCES l1nker_user(id),
    FOREIGN KEY (provider_id) REFERENCES sso_providers(id)
);

-- 创建 landing_page 表
CREATE TABLE landing_page (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faviconUrl TEXT,
    pageTitle TEXT,
    redirectKey TEXT,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    homepage_flag INTEGER DEFAULT 0,
    redirect_404 INTEGER DEFAULT 0,
    pre_release_date DATETIME,
    is_pre_release INTEGER DEFAULT 0,
    video_url VARCHAR,
    video_thumbnail_url VARCHAR,
    video_type VARCHAR,
     background_image_url TEXT,
    background_gif_url TEXT,
    FOREIGN KEY (user_id) REFERENCES l1nker_user(id)
);

-- 创建 components 表
CREATE TABLE components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    landing_page_id INTEGER,
    component_type VARCHAR,
    component_data TEXT,
    "order" INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (landing_page_id) REFERENCES landing_page(id)
);

-- 创建 social_buttons 表
CREATE TABLE social_buttons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    landing_page_id INTEGER,
    platform VARCHAR,
    url VARCHAR,
    "order" INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (landing_page_id) REFERENCES landing_page(id)
);

-- 创建 customizations 表
CREATE TABLE customizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    landing_page_id INTEGER,
    customization_type VARCHAR,
    customization_data TEXT,
    FOREIGN KEY (landing_page_id) REFERENCES landing_page(id)
);

-- 创建 click_statistics 表
CREATE TABLE click_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    landing_page_id INTEGER,
    click_time DATETIME,
     user_id INTEGER,
    user_ip VARCHAR,
    FOREIGN KEY (landing_page_id) REFERENCES landing_page(id),
     FOREIGN KEY (user_id) REFERENCES l1nker_user(id)
);

-- 创建 coupons 表
CREATE TABLE coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR UNIQUE,
    discount_type VARCHAR,
    discount_value DECIMAL,
    valid_from DATETIME,
    valid_until DATETIME
);

-- 创建 reward_programs 表
CREATE TABLE reward_programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    landing_page_id INTEGER,
    reward_type VARCHAR,
    reward_data TEXT,
    valid_from DATETIME,
    valid_until DATETIME,
    coupon_id INTEGER,
    FOREIGN KEY (landing_page_id) REFERENCES landing_page(id),
     FOREIGN KEY (coupon_id) REFERENCES coupons(id)
);

-- 创建 workspaces 表
CREATE TABLE workspaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR,
    owner_id INTEGER,
    FOREIGN KEY (owner_id) REFERENCES l1nker_user(id)
);

-- 创建 team_members 表
CREATE TABLE team_members (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id INTEGER,
    user_id INTEGER,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    FOREIGN KEY (user_id) REFERENCES l1nker_user(id)
);

-- 创建 merch_embeds 表
CREATE TABLE merch_embeds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    landing_page_id INTEGER,
    platform VARCHAR,
    embed_code TEXT,
    FOREIGN KEY (landing_page_id) REFERENCES landing_page(id)
);

-- 创建 apis 表
CREATE TABLE apis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    landing_page_id INTEGER,
    api_provider VARCHAR,
    api_config TEXT,
    FOREIGN KEY (landing_page_id) REFERENCES landing_page(id)
);

-- 创建 ads 表
CREATE TABLE ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    landing_page_id INTEGER,
    ad_provider VARCHAR,
    ad_config TEXT,
     FOREIGN KEY (landing_page_id) REFERENCES landing_page(id)
);


-- 创建 territories 表
CREATE TABLE territories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    landing_page_id INTEGER,
    country_code VARCHAR,
    FOREIGN KEY (landing_page_id) REFERENCES landing_page(id)
);

-- 创建 pop_ups 表
CREATE TABLE pop_ups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  landing_page_id INTEGER,
  trigger VARCHAR,
  content TEXT,
  start_at DATETIME,
  end_at DATETIME,
  frequency VARCHAR,
   FOREIGN KEY (landing_page_id) REFERENCES landing_page(id)
);