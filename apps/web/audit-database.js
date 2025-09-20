const postgres = require('postgres');

async function auditCompleteDatabase() {
    try {
        const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_SwXkZb54myCh@ep-autumn-cake-actozaj8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
        const sql = postgres(DATABASE_URL, { ssl: 'require' });

        console.log('🔍 AUDITORIA COMPLETA DO DATABASE NEON POSTGRESQL');
        console.log('='.repeat(70));

        // 1. Listar todas as tabelas
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `;

        console.log(`\n📋 TABELAS ENCONTRADAS: ${tables.length}`);
        tables.forEach((table, index) => {
            console.log(`   ${index + 1}. ${table.table_name}`);
        });

        // 2. Para cada tabela, mostrar estrutura detalhada
        for (const table of tables) {
            console.log(`\n${'='.repeat(50)}`);
            console.log(`📊 TABELA: ${table.table_name.toUpperCase()}`);
            console.log(`${'='.repeat(50)}`);

            // Estrutura da tabela
            const columns = await sql`
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default,
                    character_maximum_length,
                    numeric_precision,
                    numeric_scale
                FROM information_schema.columns 
                WHERE table_name = ${table.table_name}
                ORDER BY ordinal_position
            `;

            console.log('📝 COLUNAS:');
            columns.forEach(col => {
                let typeInfo = col.data_type;
                if (col.character_maximum_length) {
                    typeInfo += `(${col.character_maximum_length})`;
                }
                if (col.numeric_precision) {
                    typeInfo += `(${col.numeric_precision}${col.numeric_scale ? ',' + col.numeric_scale : ''})`;
                }
                
                const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
                
                console.log(`   🔹 ${col.column_name}: ${typeInfo} ${nullable}${defaultVal}`);
            });

            // Verificar chaves primárias
            const primaryKeys = await sql`
                SELECT kcu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu 
                    ON tc.constraint_name = kcu.constraint_name
                WHERE tc.table_name = ${table.table_name} 
                    AND tc.constraint_type = 'PRIMARY KEY'
            `;

            if (primaryKeys.length > 0) {
                console.log('🔑 CHAVE PRIMÁRIA:');
                primaryKeys.forEach(pk => {
                    console.log(`   ⭐ ${pk.column_name}`);
                });
            }

            // Verificar chaves estrangeiras
            const foreignKeys = await sql`
                SELECT
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                    AND tc.table_name = ${table.table_name}
            `;

            if (foreignKeys.length > 0) {
                console.log('🔗 CHAVES ESTRANGEIRAS:');
                foreignKeys.forEach(fk => {
                    console.log(`   🔗 ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
                });
            }

            // Verificar índices
            const indexes = await sql`
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE tablename = ${table.table_name}
                    AND schemaname = 'public'
            `;

            if (indexes.length > 0) {
                console.log('📇 ÍNDICES:');
                indexes.forEach(idx => {
                    console.log(`   📇 ${idx.indexname}`);
                });
            }

            // Contar registros
            try {
                const count = await sql`SELECT COUNT(*) as count FROM ${sql(table.table_name)}`;
                console.log(`📊 REGISTROS: ${count[0].count}`);
            } catch (error) {
                console.log(`📊 REGISTROS: Erro ao contar - ${error.message}`);
            }
        }

        // 3. Verificar relacionamentos entre tabelas críticas
        console.log(`\n${'='.repeat(70)}`);
        console.log('🔗 ANÁLISE DE RELACIONAMENTOS CRÍTICOS');
        console.log(`${'='.repeat(70)}`);

        // Verificar se devices tem organization_id
        const deviceOrgRelation = await sql`
            SELECT COUNT(*) as count 
            FROM devices d 
            JOIN organizations o ON d.organization_id = o.id
        `;
        console.log(`✅ Devices ↔ Organizations: ${deviceOrgRelation[0].count} dispositivos conectados`);

        // Verificar se users existem
        const usersCount = await sql`SELECT COUNT(*) as count FROM users`;
        console.log(`👥 Users: ${usersCount[0].count} usuários`);

        // Verificar se policies existem
        const policiesCount = await sql`SELECT COUNT(*) as count FROM policies`;
        console.log(`📋 Policies: ${policiesCount[0].count} políticas`);

        // Verificar se events existem
        const eventsCount = await sql`SELECT COUNT(*) as count FROM events`;
        console.log(`📅 Events: ${eventsCount[0].count} eventos`);

        // 4. Verificar compatibilidade com APIs
        console.log(`\n${'='.repeat(70)}`);
        console.log('🔄 ANÁLISE DE COMPATIBILIDADE COM APIs');
        console.log(`${'='.repeat(70)}`);

        // Verificar campos essenciais para o sistema web
        const criticalChecks = [
            {
                name: 'devices.id (PK para APIs)',
                query: sql`SELECT COUNT(*) as count FROM devices WHERE id IS NOT NULL`
            },
            {
                name: 'devices.name (obrigatório)',
                query: sql`SELECT COUNT(*) as count FROM devices WHERE name IS NOT NULL`
            },
            {
                name: 'devices.status (obrigatório)',
                query: sql`SELECT COUNT(*) as count FROM devices WHERE status IS NOT NULL`
            },
            {
                name: 'organizations.id (PK)',
                query: sql`SELECT COUNT(*) as count FROM organizations WHERE id IS NOT NULL`
            },
            {
                name: 'events.title (para dashboard)',
                query: sql`SELECT COUNT(*) as count FROM events WHERE title IS NOT NULL`
            }
        ];

        for (const check of criticalChecks) {
            try {
                const result = await check.query;
                console.log(`✅ ${check.name}: ${result[0].count} registros válidos`);
            } catch (error) {
                console.log(`❌ ${check.name}: ERRO - ${error.message}`);
            }
        }

        await sql.end();
        
        console.log(`\n🎉 AUDITORIA COMPLETA FINALIZADA!`);
        console.log(`💡 Use esta informação para verificar compatibilidade com APIs`);

    } catch (error) {
        console.error('❌ Erro na auditoria:', error.message);
    }
}

auditCompleteDatabase();