import { GenericContainer } from 'testcontainers';
import pg from 'pg';
const { Pool } = pg;
import { UserRepository } from './database.js';

describe('UserRepository', () => {
  let container;
  let pool;
  let userRepository;

  beforeAll(async () => {
    // Start a PostgreSQL container
    container = await new GenericContainer('postgres:15')
      .withEnvironment({
        POSTGRES_DB: 'testdb',
        POSTGRES_USER: 'testuser',
        POSTGRES_PASSWORD: 'testpass'
      })
      .withExposedPorts(5432)
      .start();

    // Create connection pool
    pool = new Pool({
      host: container.getHost(),
      port: container.getMappedPort(5432),
      database: 'testdb',
      user: 'testuser',
      password: 'testpass'
    });

    // Initialize database schema
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL
        )
      `);
    } finally {
      client.release();
    }

    // Create repository instance
    userRepository = new UserRepository(pool);
  }, 30000); // Increased timeout to allow container startup

  afterAll(async () => {
    // Close database connection
    await pool.end();
    
    // Stop the container
    await container.stop();
  });

  test('should create and retrieve a user', async () => {
    const user = await userRepository.createUser(
      'testuser', 
      'test@example.com'
    );

    expect(user).toBeTruthy();
    expect(user.username).toBe('testuser');
    expect(user.email).toBe('test@example.com');

    const retrievedUser = await userRepository.getUserByUsername('testuser');
    expect(retrievedUser).toBeTruthy();
    expect(retrievedUser.username).toBe('testuser');
  });
});