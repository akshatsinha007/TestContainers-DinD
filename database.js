import pg from 'pg';
const { Pool } = pg;

export class UserRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async createUser(username, email) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO users(username, email) VALUES($1, $2) RETURNING *', 
        [username, email]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getUserByUsername(username) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE username = $1', 
        [username]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}