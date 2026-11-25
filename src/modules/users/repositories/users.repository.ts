import type { Queryable } from '../../../database/queryable.ts';
import type {
  CreateUserInput,
  User,
  UserWithPassword,
} from '../models/user.ts';

const USER_COLUMNS = `
  id, name, email, role,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export function createUsersRepository(db: Queryable) {
  return {
    async create(input: CreateUserInput): Promise<User> {
      const { rows } = await db.query<User>(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING ${USER_COLUMNS}`,
        [input.name, input.email, input.passwordHash, input.role],
      );
      return rows[0];
    },

    async findById(id: string): Promise<User | null> {
      const { rows } = await db.query<User>(
        `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
        [id],
      );
      return rows[0] ?? null;
    },

    async findByEmailWithPassword(
      email: string,
    ): Promise<UserWithPassword | null> {
      const { rows } = await db.query<UserWithPassword>(
        `SELECT ${USER_COLUMNS}, password_hash AS "passwordHash"
         FROM users WHERE lower(email) = lower($1)`,
        [email],
      );
      return rows[0] ?? null;
    },
  };
}

export type UsersRepository = ReturnType<typeof createUsersRepository>;
