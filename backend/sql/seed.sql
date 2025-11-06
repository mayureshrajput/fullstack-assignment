USE product_catalog;
-- Insert default categories
INSERT IGNORE INTO categories (id, name) VALUES (UUID(), 'Uncategorized');

-- Example user
INSERT IGNORE INTO users (id, email, password_hash)
VALUES (UUID(), 'admin@example.com', 'REPLACE_WITH_BCRYPT_HASH');
