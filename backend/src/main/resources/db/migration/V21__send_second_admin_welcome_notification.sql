INSERT INTO notifications (account_id, title, content, type)
SELECT id, '欢迎再次使用恒昌 ERP', '您好，admin，感谢您继续使用恒昌 ERP。', 'WELCOME'
FROM accounts
WHERE username = 'admin';
