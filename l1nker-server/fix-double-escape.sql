-- 修复双重转义的 JSON 字符串
-- 使用 JSON_PARSE 和 JSON_EXTRACT 来正确处理

-- 修复 ID 为 10 的记录
UPDATE landing_page
SET buttons = JSON_EXTRACT(buttons, '$')
WHERE id = 10 AND json_valid(buttons) = 1 AND buttons LIKE '"[%';

-- 检查修复结果
SELECT
  id,
  redirectKey,
  title,
  buttons,
  json_valid(buttons) as is_valid_json
FROM landing_page
WHERE id = 10;