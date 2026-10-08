INSERT INTO notifications (account_id, title, content, type)
SELECT id, '欢迎使用恒昌 ERP', '您好，admin，欢迎使用恒昌 ERP。', 'WELCOME'
FROM accounts
WHERE username = 'admin'
  AND NOT EXISTS (
      SELECT 1
      FROM notifications
      WHERE notifications.account_id = accounts.id
        AND notifications.type = 'WELCOME'
  );
