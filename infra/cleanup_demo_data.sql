-- Limpeza de dispositivos e dados de demonstração SDB
-- Remove todos os dispositivos, políticas, comandos, eventos, localizações e registros de emparelhamento

DELETE FROM device_registrations;
DELETE FROM device_policies;
DELETE FROM commands;
DELETE FROM events;
DELETE FROM locations;
DELETE FROM devices;
DELETE FROM policies;
DELETE FROM users;
