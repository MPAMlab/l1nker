-- 更新 profile image URL，只保留文件名部分
UPDATE landing_page
SET profileImageUrl =
  CASE
    WHEN profileImageUrl LIKE 'https://my-r2-bucket.r2.dev/%' THEN
      SUBSTR(profileImageUrl, LENGTH('https://my-r2-bucket.r2.dev/') + 1)
    WHEN profileImageUrl LIKE 'https://undefined.r2.dev/%' THEN
      SUBSTR(profileImageUrl, LENGTH('https://undefined.r2.dev/') + 1)
    ELSE
      profileImageUrl
  END
WHERE profileImageUrl LIKE '%r2.dev%';

-- 检查更新结果
SELECT id, redirectKey, profileImageUrl FROM landing_page WHERE profileImageUrl LIKE '%r2.dev%';