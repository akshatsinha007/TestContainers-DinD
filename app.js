import pkg from 'pg';
const { Pool } = pkg;
import { GenericContainer } from 'testcontainers';
import { UserRepository } from './database.js';

async function main() {
  // Start a PostgreSQL container
  process.env.DOCKER_HOST = 'unix:///var/run/docker.sock';
  const container = await new GenericContainer('postgres:14')
    .withEnvironment({
      POSTGRES_DB: 'testdb',
      POSTGRES_USER: 'testuser',
      POSTGRES_PASSWORD: 'testpass'
    })
    .withExposedPorts(5432)
    .start();

  // Create connection pool
  const pool = new Pool({
    host: container.getHost(),
    port: container.getMappedPort(5432),
    database: 'testdb',
    user: 'testuser',
    password: 'testpass'
  });

  // Create repository instance
  const userRepository = new UserRepository(pool);

  try {
    // Initialize database schema
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL
        )
      `);
    } finally {
      client.release();
    }

    // Create a user
    const newUser = await userRepository.createUser('example_user', 'example@email.com');
    console.log('Created user:', newUser);

    // Retrieve the user
    const retrievedUser = await userRepository.getUserByUsername('example_user');
    console.log('Retrieved user:', retrievedUser);
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Close the pool and stop the container
    await pool.end();
    await container.stop();
  }
}

// Run the main function
main().catch(console.error);