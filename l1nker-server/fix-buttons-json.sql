-- 修复 buttons 字段中的双重 JSON 转义问题
-- 当数据库中的值是 JSON 字符串的字面量（而不是实际的 JSON 数组）时进行修复

UPDATE landing_page
SET buttons =
  CASE
    -- 检查是否是以 "[{" 开头并以 "}]" 结尾的字符串
    WHEN buttons LIKE '"[%"' AND buttons LIKE '%]"' AND LENGTH(buttons) > 10 THEN
      -- 尝试解析两次转义的 JSON
      CASE
        WHEN json_valid(buttons) = 0 THEN
          -- 如果不是有效的 JSON，尝试去掉外层引号
          SUBSTR(buttons, 2, LENGTH(buttons) - 2)
        ELSE
          buttons
      END
    ELSE
      buttons
  END
WHERE buttons LIKE '"[%"' AND buttons LIKE '%]"';

-- 检查修复结果
SELECT
  id,
  redirectKey,
  title,
  CASE
    WHEN LENGTH(buttons) < 50 THEN buttons
    ELSE SUBSTR(buttons, 1, 50) || '...'
  END as buttons_sample,
  json_valid(buttons) as is_valid_json
FROM landing_page
WHERE buttons LIKE '"[%"' OR buttons LIKE '%]\"';