-- 更新 favicon URL，只保留文件名部分
UPDATE landing_page
SET faviconUrl =
  CASE
    WHEN faviconUrl LIKE 'https://my-r2-bucket.r2.dev/%' THEN
      SUBSTR(faviconUrl, LENGTH('https://my-r2-bucket.r2.dev/') + 1)
    WHEN faviconUrl LIKE 'https://undefined.r2.dev/%' THEN
      SUBSTR(faviconUrl, LENGTH('https://undefined.r2.dev/') + 1)
    ELSE
      faviconUrl
  END
WHERE faviconUrl LIKE '%r2.dev%';

-- 检查更新结果
SELECT id, redirectKey, faviconUrl FROM landing_page WHERE faviconUrl LIKE '%r2.dev%' OR faviconUrl LIKE '%favicon%';