/**
 * Jest Setup File
 * Configurações globais para os testes do sistema multi-tenant
 */

// Mock para o Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  auth: () => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'test-uid',
      email: 'test@example.com',
    }),
    createUser: jest.fn().mockResolvedValue({
      uid: 'new-user-uid',
      email: 'newuser@example.com',
    }),
    updateUser: jest.fn().mockResolvedValue({}),
    deleteUser: jest.fn().mockResolvedValue({}),
  }),
  firestore: () => ({
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({}),
    }),
    add: jest.fn().mockResolvedValue({ id: 'mock-doc-id' }),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  }),
  credential: {
    cert: jest.fn(),
  },
}));

// Mock para o cliente PostgreSQL
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: jest.fn(),
    }),
    end: jest.fn().mockResolvedValue(),
  })),
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(),
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    end: jest.fn().mockResolvedValue(),
  })),
}));

// Mock para Next.js
jest.mock('next/headers', () => ({
  headers: () => new Map(),
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      headers: new Map(),
    })),
    redirect: jest.fn((url) => ({
      status: 302,
      headers: new Map([['Location', url]]),
    })),
  },
}));

// Mock para variáveis de ambiente
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.FIREBASE_PROJECT_ID = 'test-project';

// Configurações globais de timeout
global.testTimeout = 10000;

// Mock para console em testes (reduz ruído)
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};