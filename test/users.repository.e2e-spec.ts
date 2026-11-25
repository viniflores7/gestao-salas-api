import { randomUUID } from 'node:crypto';
import { pool } from '../src/database/pool.ts';
import { createUsersRepository } from '../src/modules/users/repositories/users.repository.ts';

const repository = createUsersRepository(pool);
const createdEmails: string[] = [];

function uniqueEmail() {
  const email = `user-${randomUUID()}@e2e.test`;
  createdEmails.push(email);
  return email;
}

describe('users repository', () => {
  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = ANY($1)', [
      createdEmails,
    ]);
    await pool.end();
  });

  it('creates a user with the default fields filled by the database', async () => {
    const email = uniqueEmail();

    const user = await repository.create({
      name: 'Maria',
      email,
      passwordHash: 'hash',
      role: 'user',
    });

    expect(user).toEqual({
      id: expect.any(String),
      name: 'Maria',
      email,
      role: 'user',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    expect(user).not.toHaveProperty('passwordHash');
    expect(await repository.findById(user.id)).toEqual(user);
  });

  it('finds a user by e-mail ignoring case, including the password hash', async () => {
    const email = uniqueEmail();
    await repository.create({
      name: 'João',
      email,
      passwordHash: 'secret-hash',
      role: 'admin',
    });

    const found = await repository.findByEmailWithPassword(email.toUpperCase());

    expect(found).toMatchObject({
      email,
      role: 'admin',
      passwordHash: 'secret-hash',
    });
  });

  it('rejects two users with the same e-mail in different case', async () => {
    const email = uniqueEmail();
    await repository.create({
      name: 'A',
      email,
      passwordHash: 'h',
      role: 'user',
    });

    await expect(
      repository.create({
        name: 'B',
        email: email.toUpperCase(),
        passwordHash: 'h',
        role: 'user',
      }),
    ).rejects.toMatchObject({ code: '23505' });
  });
});
