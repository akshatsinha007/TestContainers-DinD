// database.test.js
import { GenericContainer } from 'testcontainers';
import pg from 'pg';
const { Pool } = pg;
import { UserRepository } from './database.js';

describe('UserRepository', () => {
  let container;
  let pool;
  let userRepository;

  beforeAll(async () => {
    try {
      // Use postgres:14 for broader compatibility
      process.env.DOCKER_HOST = 'unix:///var/run/docker.sock';
      container = await new GenericContainer('postgres:14')
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

      // Verify connection
      const client = await pool.connect();
      try {
        await client.query('SELECT NOW()');
        console.log('Database connection successful');
      } finally {
        client.release();
      }

      // Initialize database schema
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL
        )
      `);

      // Create repository instance
      userRepository = new UserRepository(pool);
    } catch (error) {
      console.error('Container startup error:', error);
      throw error;
    }
  }, 60000);

  afterAll(async () => {
    try {
      // Safely close pool if it exists
      if (pool) {
        await pool.end();
      }
      
      // Stop the container if it exists
      if (container) {
        await container.stop();
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }, 10000);

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