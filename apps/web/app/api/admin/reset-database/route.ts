import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// GET /api/admin/reset-database - Status do banco
export async function GET(request: NextRequest) {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    
    // Verificar se existem tabelas
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    await sql.end();
    
    return NextResponse.json({
      success: true,
      message: 'Status do banco de dados',
      data: {
        tables_count: tables.length,
        tables: tables.map(t => t.table_name),
        database_configured: tables.length > 0
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar banco de dados',
      details: error.message
    }, { status: 500 });
  }
}

// POST /api/admin/reset-database - Reset completo do banco de dados FRIAXIS v4.0.0
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando reset completo do banco de dados FRIAXIS v4.0.0...');
    
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // 1. DROPAR TODAS AS TABELAS EXISTENTES
    console.log('🗑️ Removendo tabelas existentes...');
    
    const dropTables = [
      'notifications', 'alerts', 'events', 'locations', 'organization_members',
      'device_policies', 'device_telemetry', 'device_commands', 'device_registrations',
      'audit_logs', 'subscriptions', 'devices', 'policies', 'users', 'organizations'
    ];

    for (const table of dropTables) {
      try {
        await sql`DROP TABLE IF EXISTS ${sql(table)} CASCADE`;
        console.log(`✅ Tabela ${table} removida`);
      } catch (error) {
        console.log(`⚠️ Tabela ${table} não existia`);
      }
    }

    console.log('🏗️ Criando estrutura completa...');

    // 1. ORGANIZATIONS
    await sql`
      CREATE TABLE organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        subscription_tier VARCHAR(50) DEFAULT 'basic',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ organizations criada');

    // 2. USERS
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        firebase_uid VARCHAR(128) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ users criada');

    // 3. POLICIES
    await sql`
      CREATE TABLE policies (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        restrictions JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ policies criada');

    // 4. DEVICES
    await sql`
      CREATE TABLE devices (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        device_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        model VARCHAR(100),
        android_version VARCHAR(50),
        policy_id INTEGER REFERENCES policies(id),
        fcm_token TEXT,
        last_seen TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        battery_level INTEGER,
        location_lat DECIMAL(10, 8),
        location_lng DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ devices criada');

    // 5. DEVICE REGISTRATIONS (Corrigida com device_info)
    await sql`
      CREATE TABLE device_registrations (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        pairing_code VARCHAR(10) UNIQUE NOT NULL,
        device_info JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        created_by_admin BOOLEAN DEFAULT false,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ device_registrations criada');

    // 6. ORGANIZATION MEMBERS
    await sql`
      CREATE TABLE organization_members (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(organization_id, user_id)
      )
    `;
    console.log('✅ organization_members criada');

    // 7. DEVICE POLICIES
    await sql`
      CREATE TABLE device_policies (
        id SERIAL PRIMARY KEY,
        device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
        policy_id INTEGER REFERENCES policies(id) ON DELETE CASCADE,
        applied_at TIMESTAMP DEFAULT NOW(),
        applied_by INTEGER REFERENCES users(id),
        UNIQUE(device_id, policy_id)
      )
    `;
    console.log('✅ device_policies criada');

    // 8. DEVICE TELEMETRY
    await sql`
      CREATE TABLE device_telemetry (
        id SERIAL PRIMARY KEY,
        device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
        battery_level INTEGER,
        location_lat DECIMAL(10, 8),
        location_lng DECIMAL(11, 8),
        signal_strength INTEGER,
        storage_used BIGINT,
        memory_used BIGINT,
        recorded_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ device_telemetry criada');

    // 9. DEVICE COMMANDS
    await sql`
      CREATE TABLE device_commands (
        id SERIAL PRIMARY KEY,
        device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
        command_type VARCHAR(100) NOT NULL,
        parameters JSONB DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'pending',
        executed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ device_commands criada');

    // 10. EVENTS
    await sql`
      CREATE TABLE events (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,
        description TEXT,
        data JSONB DEFAULT '{}',
        severity VARCHAR(20) DEFAULT 'info',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ events criada');

    // 11. LOCATIONS
    await sql`
      CREATE TABLE locations (
        id SERIAL PRIMARY KEY,
        device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        accuracy DECIMAL(8, 2),
        altitude DECIMAL(8, 2),
        speed DECIMAL(6, 2),
        heading DECIMAL(6, 2),
        recorded_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ locations criada');

    // 12. ALERTS
    await sql`
      CREATE TABLE alerts (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
        alert_type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        severity VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'active',
        acknowledged_by INTEGER REFERENCES users(id),
        acknowledged_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ alerts criada');

    // 13. NOTIFICATIONS
    await sql`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        type VARCHAR(50) DEFAULT 'info',
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ notifications criada');

    // 14. AUDIT LOGS
    await sql`
      CREATE TABLE audit_logs (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(255) NOT NULL,
        resource_type VARCHAR(100),
        resource_id INTEGER,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ audit_logs criada');

    // 15. SUBSCRIPTIONS
    await sql`
      CREATE TABLE subscriptions (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        plan_name VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        device_limit INTEGER DEFAULT 10,
        features JSONB DEFAULT '{}',
        starts_at TIMESTAMP DEFAULT NOW(),
        ends_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ subscriptions criada');

    console.log('📊 Criando índices de performance...');

    // Índices essenciais
    await sql`CREATE INDEX idx_devices_organization_id ON devices(organization_id)`;
    await sql`CREATE INDEX idx_devices_device_id ON devices(device_id)`;
    await sql`CREATE INDEX idx_devices_fcm_token ON devices(fcm_token)`;
    await sql`CREATE INDEX idx_users_firebase_uid ON users(firebase_uid)`;
    await sql`CREATE INDEX idx_users_organization_id ON users(organization_id)`;
    await sql`CREATE INDEX idx_device_registrations_code ON device_registrations(pairing_code)`;
    await sql`CREATE INDEX idx_device_registrations_org ON device_registrations(organization_id)`;
    await sql`CREATE INDEX idx_device_registrations_device_info ON device_registrations USING gin(device_info)`;
    await sql`CREATE INDEX idx_device_telemetry_device ON device_telemetry(device_id)`;
    await sql`CREATE INDEX idx_device_commands_device ON device_commands(device_id)`;
    await sql`CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id)`;
    await sql`CREATE INDEX idx_events_device_id ON events(device_id)`;
    await sql`CREATE INDEX idx_events_org_id ON events(organization_id)`;
    await sql`CREATE INDEX idx_locations_device_id ON locations(device_id)`;
    await sql`CREATE INDEX idx_alerts_device_id ON alerts(device_id)`;
    await sql`CREATE INDEX idx_alerts_org_id ON alerts(organization_id)`;
    await sql`CREATE INDEX idx_notifications_user_id ON notifications(user_id)`;
    
    console.log('✅ Índices criados com sucesso');

    console.log('🔧 Inserindo dados iniciais...');

    // Organização padrão
    const [org] = await sql`
      INSERT INTO organizations (name, slug, subscription_tier)
      VALUES ('Development Organization', 'dev-org', 'premium')
      RETURNING id
    `;

    // Subscription padrão
    await sql`
      INSERT INTO subscriptions (organization_id, plan_name, device_limit)
      VALUES (${org.id}, 'Premium', 100)
    `;

    console.log('✅ Dados iniciais inseridos');

    await sql.end();

    return NextResponse.json({
      success: true,
      message: 'Banco de dados resetado com sucesso!',
      details: {
        tables_created: 15,
        indexes_created: 17,
        organization_id: org.id,
        database_url_configured: !!process.env.DATABASE_URL,
        features: [
          'device_info JSONB support',
          'fcm_token field',
          'multi-tenant architecture',
          'comprehensive indexing'
        ]
      }
    });

  } catch (error: any) {
    console.error('❌ Erro durante reset:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 });
  }
}