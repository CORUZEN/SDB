-- Migration: Adicionar tabela para registros de dispositivos pendentes
-- Criado em: 2025-09-14

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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_device_registrations_pairing_code ON device_registrations(pairing_code);
CREATE INDEX IF NOT EXISTS idx_device_registrations_status ON device_registrations(status);
CREATE INDEX IF NOT EXISTS idx_device_registrations_expires_at ON device_registrations(expires_at);

-- Limpar registros expirados automaticamente (opcional)
CREATE OR REPLACE FUNCTION cleanup_expired_registrations()
RETURNS void AS $$
BEGIN
    DELETE FROM device_registrations 
    WHERE expires_at < NOW() AND status = 'pending';
END;
$$ LANGUAGE plpgsql;