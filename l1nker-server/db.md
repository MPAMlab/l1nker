# **表和列的详细定义：**

**1. `l1nker_user` 表:**

| 列名                 | 类型            | 约束 / 默认值           | 可能的值                                                                          | 描述                                            |
| -------------------- | --------------- | --------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------- |
| `id`                 | INTEGER         | PRIMARY KEY AUTOINCREMENT| 1, 2, 3, ...                                                                   | 用户 ID，自增长。                                  |
| `username`           | TEXT            | NOT NULL             | "john_doe", "jane123", "cool_coder"                                          | 用户名。                                        |
| `password`           | TEXT            | NOT NULL             | 哈希后的密码字符串                                                            | 密码的哈希值，用于身份验证。                            |
| `managed_projects`   | TEXT            | DEFAULT '\*'       | "project1,project2", "\*", "project3"                                          | 用户可以管理的 landing pages 的列表，将废弃 |
| `created_at`         | DATETIME        | DEFAULT CURRENT_TIMESTAMP| "2024-10-27 10:00:00", "2024-11-15 14:30:00"                                 | 用户创建时间。                                      |
| `updated_at`         | DATETIME        | DEFAULT CURRENT_TIMESTAMP| "2024-10-27 10:00:00", "2024-11-15 15:00:00"                                 | 用户信息最后更新时间。                              |
| `role`               | VARCHAR(255)    | DEFAULT 'user'         | "user", "admin", "team_admin", ...                                              | 用户的角色，将废弃，统一使用 `user_role_assignment`   |
| `email`              | VARCHAR(255)    | DEFAULT ''             | "john.doe@example.com", "jane123@example.com"                                 | 用户邮箱地址。                                    |
| `last_password_change` | DATETIME        | NULLABLE               | "2024-11-10 08:00:00", NULL                                                     | 最后一次修改密码的时间。                                  |
| `two_factor_secret`   | TEXT            | NULLABLE              | "base32_encoded_secret", NULL                                                  | 2FA 密钥，用于生成 TOTP 代码。                        |

**2. `user_roles` 表:**

| 列名             | 类型        | 约束 / 默认值 | 可能的值                                     | 描述                        |
| ---------------- | ----------- | ------------- | ------------------------------------------- | --------------------------- |
| `id`             | INTEGER     | PRIMARY KEY AUTOINCREMENT  | 1, 2, 3, ...                           | 角色 ID，自增长。             |
| `role_name`      | VARCHAR     | UNIQUE        | "admin", "team_admin", "editor", "viewer" | 角色的名称，例如:系统管理员，团队管理员 |
|`is_system_role` | BOOLEAN   | DEFAULT 0      | 0, 1                                      | 是否是系统级别的角色,1为是，0为否   |

**3. `user_role_assignment` 表:**

| 列名         | 类型    | 约束      | 可能的值                                                        | 描述                          |
| ----------- | ------- | -------- | --------------------------------------------------------------- | ----------------------------- |
| `user_id`    | INTEGER | FOREIGN KEY references `l1nker_user(id)` | 1, 2, 3, ...                                                 | 用户 ID。                       |
| `role_id`    | INTEGER | FOREIGN KEY references `user_roles(id)` | 1, 2, 3, ...                                                 | 角色 ID。                       |
| `scope`      | VARCHAR |         | "system", "workspace"                                          | 角色的范围，例如系统或工作区 |
| `scope_id`   | INTEGER | NULLABLE  | 1, 2, 3, ..., NULL                                              | 如果 scope 为 `workspace`则为 workspace 的 id|

**4. `sso_providers` 表:**

| 列名             | 类型        | 约束 / 默认值 | 可能的值                   | 描述                       |
| --------------- | ----------- | ------------- | ------------------------ | -------------------------- |
| `id`             | INTEGER     | PRIMARY KEY AUTOINCREMENT | 1, 2, 3, ...                | SSO 提供商 ID，自增长       |
| `name`         | VARCHAR     | UNIQUE        | "Google", "GitHub", ... | SSO 提供商名称，例如：Google |

**5. `sso_users` 表:**

| 列名             | 类型        | 约束 / 默认值  | 可能的值                        | 描述                         |
| --------------- | ----------- | ------------- | ----------------------------- | ---------------------------- |
| `id`             | INTEGER     | PRIMARY KEY AUTOINCREMENT    | 1, 2, 3, ...                       | SSO 用户 ID，自增长           |
| `user_id`        | INTEGER     | FOREIGN KEY references `l1nker_user(id)`      | 1, 2, 3, ...                       | 本地用户表 ID                    |
| `provider_id`    | INTEGER     | FOREIGN KEY references `sso_providers(id)`  | 1, 2, 3, ...                       | SSO 服务提供商 ID               |
| `provider_user_id` | VARCHAR   | UNIQUE        | "google_user_123", "github_user_456" | SSO 服务提供商的用户 ID        |

**6.`landing_page` 表:**

| 列名                 | 类型        | 约束 / 默认值         | 描述                                                    |
| -------------------- | ----------- | ------------------- | ------------------------------------------------------- |
| `id`                 | INTEGER     | PRIMARY KEY AUTOINCREMENT  | Landing Page ID，自增长。                                       |
| `faviconUrl`         | TEXT        | NULLABLE              | Landing Page 的 Favicon URL。                                 |
| `pageTitle`          | TEXT        | NULLABLE              | Landing Page 的 HTML 页面的标题。                             |
| `redirectKey`        | TEXT        | NULLABLE              | 用于 URL 路由的 Key。                                      |
| `user_id`            | INTEGER     | FOREIGN KEY references `l1nker_user(id)`| Landing Page 的所有者 ID。                                 |
| `created_at`         | DATETIME    | DEFAULT CURRENT_TIMESTAMP| Landing Page 创建时间。                                     |
| `updated_at`         | DATETIME    | DEFAULT CURRENT_TIMESTAMP| Landing Page 最后更新时间。                                   |
| `homepage_flag`      | BOOLEAN     | DEFAULT 0            | 是否为首页，1 表示是，0 表示否。                         |
| `redirect_404`    | BOOLEAN       | DEFAULT 0            | 是否为 404 页面，1 表示是，0 表示否。 |
| `pre_release_date`    | DATETIME   | NULLABLE              | 预发布日期。                                             |
| `is_pre_release`   | BOOLEAN      | DEFAULT 0            | 是否为预发布页面，1 表示是，0 表示否。                         |
| `video_url`       | VARCHAR   | NULLABLE             | 视频 URL。                                             |
| `video_thumbnail_url` | VARCHAR   | NULLABLE             | 视频的缩略图 URL。                                       |
| `video_type` | VARCHAR    | NULLABLE             | 视频类型。                                          |
| `background_image_url` | TEXT     | NULLABLE           | 背景图片 URL。                                    |
| `background_gif_url` | TEXT     | NULLABLE           | 背景 GIF URL。                                     |

**7. `components` 表:**

| 列名             | 类型        | 约束 / 默认值  | 描述                               |
| --------------- | ----------- | ------------- | ---------------------------------- |
| `id`             | INTEGER     | PRIMARY KEY AUTOINCREMENT   | 组件 ID，自增长                    |
| `landing_page_id`| INTEGER     | FOREIGN KEY references `landing_page(id)` | 所属 Landing Page ID                |
| `component_type` | VARCHAR     |              | 组件类型，例如：`profile_header`, `button_list`, `artist`, `podcast`, `event`, `text`, `image`, `button` |
| `component_data` | TEXT        |              | JSON 格式的组件数据                  |
| `order`          | INTEGER     |              | 组件排序号                              |
| `created_at`    | DATETIME    | DEFAULT CURRENT_TIMESTAMP  | 组件创建时间                    |
| `updated_at`    | DATETIME    | DEFAULT CURRENT_TIMESTAMP  | 组件最后更新时间                   |

**8. `social_buttons` 表:**

| 列名             | 类型        | 约束 / 默认值 | 可能的值                     | 描述                   |
| --------------- | ----------- | ------------- | --------------------------- | ---------------------- |
| `id`             | INTEGER     | PRIMARY KEY AUTOINCREMENT | 1, 2, 3, ...            | 按钮 ID，自增长         |
| `landing_page_id`| INTEGER     | FOREIGN KEY references `landing_page(id)` | 1, 2, 3, ...            | 所属 Landing Page ID     |
| `platform`       | VARCHAR     |              | "twitter", "facebook", "instagram", ... | 社交平台名称             |
| `url`            | VARCHAR     |              | "https://twitter.com/user", ... | 社交链接 URL             |
| `order`          | INTEGER     |              | 1, 2, 3, ...                | 按钮排序号               |
| `created_at`    | DATETIME    | DEFAULT CURRENT_TIMESTAMP | "2024-10-27 10:00:00", "2024-11-15 14:30:00" | 按钮创建时间             |
| `updated_at`    | DATETIME    | DEFAULT CURRENT_TIMESTAMP  | "2024-10-27 10:00:00", "2024-11-15 15:00:00"  | 按钮最后更新时间          |

**9. `customizations` 表:**

| 列名               | 类型        | 约束 / 默认值 | 可能的值                                         | 描述                   |
| ----------------- | ----------- | ------------- | ------------------------------------------------ | ---------------------- |
| `id`              | INTEGER     | PRIMARY KEY AUTOINCREMENT | 1, 2, 3, ...                                      | 自定义设置 ID，自增长     |
| `landing_page_id` | INTEGER     | FOREIGN KEY references `landing_page(id)` | 1, 2, 3, ...                                     | 所属 Landing Page ID      |
| `customization_type`| VARCHAR     |               | "theme", "layout", "font", ...                     | 自定义设置类型            |
| `customization_data`| TEXT        |              | '{"theme": "dark", "primaryColor": "#000"}', ... | JSON 格式的自定义数据      |

**10. `click_statistics` 表:**

| 列名             | 类型      | 约束 / 默认值 | 可能的值                                  | 描述                     |
| --------------- | --------- | ------------- | ---------------------------------------- | ------------------------ |
| `id`            | INTEGER   | PRIMARY KEY AUTOINCREMENT | 1, 2, 3, ...                            | 点击统计 ID，自增长     |
| `landing_page_id`| INTEGER   | FOREIGN KEY references `landing_page(id)` | 1, 2, 3, ...                            | 所属 Landing Page ID      |
| `click_time`    | DATETIME   |             | "2024-10-27 10:00:00", "2024-11-15 14:30:00"| 点击时间                  |
| `user_id`       | INTEGER   |  FOREIGN KEY references `l1nker_user(id)`, NULLABLE     | 1, 2, 3, ..., NULL                 | 点击用户的 ID （可选）    |
| `user_ip`      | VARCHAR    |           | "127.0.0.1", "192.168.1.100"               | 点击用户的 IP 地址      |

**11. `coupons` 表:**

| 列名             | 类型       | 约束 / 默认值 | 可能的值                            | 描述                             |
| --------------- | ---------- | ------------- | ---------------------------------- | -------------------------------- |
| `id`            | INTEGER    | PRIMARY KEY AUTOINCREMENT | 1, 2, 3, ...                      | 优惠券 ID，自增长                |
| `code`          | VARCHAR    | UNIQUE        | "SUMMER20", "FREESHIP", "GET10"  | 优惠券代码                         |
| `discount_type`  | VARCHAR    |               | "percentage", "amount"             | 折扣类型（百分比或金额）              |
| `discount_value`| DECIMAL    |               | 0.1, 0.2, 10.0, 20.0                | 折扣值，例如 0.1 代表 10%         |
| `valid_from`    | DATETIME   |               | "2024-11-01 00:00:00"              | 优惠券有效期起始时间                  |
| `valid_until`   | DATETIME   |               | "2024-12-31 23:59:59"              | 优惠券有效期结束时间                  |

**12. `reward_programs` 表:**

| 列名              | 类型       | 约束 / 默认值    | 可能的值                      | 描述                     |
| ----------------- | ---------- | --------------- | ---------------------------- | ------------------------ |
| `id`              | INTEGER    | PRIMARY KEY AUTOINCREMENT | 1, 2, 3, ...               | 奖励计划 ID，自增长      |
| `landing_page_id` | INTEGER    | FOREIGN KEY references `landing_page(id)` | 1, 2, 3, ...                | 所属 Landing Page ID    |
| `reward_type`     | VARCHAR    |                 | "discount", "free_item", ... | 奖励类型                  |
| `reward_data`     | TEXT        |                 | '{"item_name": "gift", "quantity": 1}', ... | JSON 格式的奖励数据        |
| `valid_from`      | DATETIME   |                 | "2024-11-01 00:00:00"          | 奖励有效期起始时间        |
| `valid_until`     | DATETIME   |                 | "2024-12-31 23:59:59"          | 奖励有效期结束时间        |
| `coupon_id` | INTEGER    | FOREIGN KEY references `coupons(id)`, NULLABLE| 1,2,3,... , NULL| 如果是优惠券形式，优惠券id           |

**13. `workspaces` 表:**

| 列名         | 类型    | 约束 / 默认值 | 可能的值   | 描述                   |
| ----------- | ------- | ------------- | --------- | ---------------------- |
| `id`        | INTEGER | PRIMARY KEY AUTOINCREMENT | 1, 2, 3, ...| 工作区 ID，自增长       |
| `name`      | VARCHAR |             | "My Team", "Personal Projects" | 工作区名称                |
| `owner_id` | INTEGER   | FOREIGN KEY references `l1nker_user(id)`| 1, 2, 3, ...   | 工作区所有者 ID             |

**14. `team_members` 表:**

| 列名        | 类型    | 约束 / 默认值 | 可能的值   | 描述                   |
| ----------- | ------- | ------------- | --------- | ---------------------- |
| `id`        | INTEGER | PRIMARY KEY AUTOINCREMENT | 1, 2, 3, ... | 成员 ID，自增长         |
| `workspace_id`| INTEGER    | FOREIGN KEY references `workspaces(id)` | 1, 2, 3, ...       | 所属工作区 ID        |
| `user_id`   | INTEGER   |  FOREIGN KEY references `l1nker_user(id)`| 1, 2, 3, ... | 用户 ID                 |

**15. `merch_embeds` 表:**

| 列名             | 类型    | 约束 / 默认值 | 可能的值                              | 描述                      |
| --------------- | -------- | ------------- | ------------------------------------ | ------------------------ |
| `id`           | INTEGER  | PRIMARY KEY AUTOINCREMENT| 1, 2, 3, ...                           | 嵌入 ID，自增长          |
| `landing_page_id`| INTEGER | FOREIGN KEY references `landing_page(id)`  | 1, 2, 3, ...                           | 所属 Landing Page ID       |
| `platform`      | VARCHAR  |              | "shopify", "teespring"              | 电商平台名称                |
| `embed_code`   | TEXT     |              | "<iframe src='...'</iframe>", "<div>...</div>"  | 嵌入代码                 |

**16. `apis` 表:**

| 列名               | 类型    | 约束 / 默认值 | 可能的值                                     | 描述                       |
| ----------------- | -------- | ------------- | ------------------------------------------- | -------------------------- |
| `id`              | INTEGER  | PRIMARY KEY AUTOINCREMENT | 1, 2, 3, ...                               | API 配置 ID，自增长        |
| `landing_page_id` | INTEGER | FOREIGN KEY references `landing_page(id)` | 1, 2, 3, ...                               | 所属 Landing Page ID        |
| `api_provider`   | VARCHAR  |             | "google_analytics", "discord_webhook"     | API 提供商名称               |
| `api_config`      | TEXT     |            | '{"tracking_id": "UA-XXXXX"}', '{"webhook_url":"..."}' | JSON 格式的 API 配置        |

**17. `ads` 表:**

| 列名               | 类型    | 约束 / 默认值 | 可能的值                             | 描述                     |
| ----------------- | -------- | ------------- | ------------------------------------ | ------------------------ |
| `id`              | INTEGER | PRIMARY KEY AUTOINCREMENT  | 1, 2, 3, ...                         | 广告配置 ID，自增长      |
| `landing_page_id` | INTEGER | FOREIGN KEY references `landing_page(id)` | 1, 2, 3, ...                         | 所属 Landing Page ID       |
| `ad_provider`     | VARCHAR |              | "google_ads", "facebook_ads"        | 广告提供商名称               |
| `ad_config`       | TEXT    |              | '{"ad_id": "12345", "campaign_id": "67890"}', ...   | JSON 格式的广告配置        |

**18. `territories` 表:**

| 列名              | 类型    | 约束 / 默认值 | 可能的值 | 描述                      |
| ----------------- | ------- | ------------- | ---------- | ------------------------- |
| `id`              | INTEGER  | PRIMARY KEY AUTOINCREMENT  | 1, 2, 3, ...| 地区 ID，自增长         |
| `landing_page_id` | INTEGER | FOREIGN KEY references `landing_page(id)` | 1, 2, 3, ... | 所属 Landing Page ID        |
| `country_code`     | VARCHAR |              | "US", "CN", "JP", "DE", ...| ISO 国家代码            |

**19. `pop_ups` 表:**

| 列名               | 类型     | 约束 / 默认值 | 可能的值                                                                 | 描述                          |
| ----------------- | -------- | ------------- | ------------------------------------------------------------------------ | ----------------------------- |
| `id`              | INTEGER | PRIMARY KEY AUTOINCREMENT | 1, 2, 3, ...                                                      | 弹窗 ID，自增长                |
| `landing_page_id` | INTEGER | FOREIGN KEY references `landing_page(id)`  | 1, 2, 3, ...                                                      | 所属 Landing Page ID           |
| `trigger`          | VARCHAR   |            | "on_page_load", "on_exit_intent", "on_scroll"                               | 弹窗触发条件，例如页面加载时、鼠标离开页面时          |
| `content`           | TEXT       |            | "<h1>Hello</h1><p>...</p>", "<img src='...'>", ...                         | 弹窗内容                         |
| `start_at` | DATETIME | NULLABLE |  "2024-10-27 10:00:00", "2024-11-15 14:30:00", NULL                                       | 弹窗起始时间，为空表示立即开始 |
| `end_at` | DATETIME | NULLABLE |  "2024-10-27 10:00:00", "2024-11-15 14:30:00", NULL                                       | 弹窗结束时间，为空表示一直持续 |
| `frequency`       | VARCHAR   |             | "once", "every_session", "every_visit"                                   | 弹窗显示频率                          |

**注意：**

*   `NULLABLE` 表示该列可以为空。
*   `DEFAULT` 表示该列的默认值。
*   `FOREIGN KEY` 表示该列是外键，用于建立表之间的关系。
*   `UNIQUE` 表示该列的值必须唯一。
*   `AUTOINCREMENT` 表示该列是自增长的。
*   `DATETIME` 表示日期时间类型。
*   `BOOLEAN` 表示布尔类型，通常用 0 和 1 表示。
*  `DECIMAL` 表示精确的浮点数
