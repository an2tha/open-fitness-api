-- Seed data: Create default API key configuration
INSERT INTO api_key_configurations (name, created_at, updated_at, default_rate_limit_max, default_time_window, prefix_length, references, storage, fallback_to_database, defer_updates)
VALUES ('default', NOW(), NOW(), 1000, 60, 8, 'userId', 'primary', false, false)
ON CONFLICT DO NOTHING;