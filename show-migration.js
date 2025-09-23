-- Test migration via API endpoint
const migrationSQL = `
CREATE TABLE IF NOT EXISTS device_registrations (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    pairing_code VARCHAR(6) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    android_version VARCHAR(50) NOT NULL,
    firebase_token TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    approved_at TIMESTAMP,
    approved_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_device_registrations_pairing_code ON device_registrations(pairing_code);
CREATE INDEX IF NOT EXISTS idx_device_registrations_status ON device_registrations(status);
CREATE INDEX IF NOT EXISTS idx_device_registrations_expires_at ON device_registrations(expires_at);
`;

console.log('SQL Migration:');
console.log(migrationSQL);