-- 创建艺术家资料表
CREATE TABLE artist_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    artist_name TEXT NOT NULL,
    profile_photo_url TEXT,
    main_profile TEXT,
    secondary_profile TEXT,
    artist_page_key TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建艺术家链接表
CREATE TABLE artist_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_profile_id INTEGER NOT NULL,
    platform_name TEXT NOT NULL,
    url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 在 landing_page 表中添加字段
ALTER TABLE landing_page ADD COLUMN show_artist_section BOOLEAN DEFAULT 0;
ALTER TABLE landing_page ADD COLUMN artist_profile_id INTEGER;