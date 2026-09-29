// Set required environment variables before any test module loads
process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-characters-long-for-testing';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/telecom_ai';
