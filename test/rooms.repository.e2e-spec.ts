import { randomUUID } from 'node:crypto';
import { pool } from '../src/database/pool.ts';
import { createRoomsRepository } from '../src/modules/rooms/repositories/rooms.repository.ts';
import { createUsersRepository } from '../src/modules/users/repositories/users.repository.ts';

const repository = createRoomsRepository(pool);
const createdRoomIds: string[] = [];
const createdUserIds: string[] = [];

function uniqueName() {
  return `Sala ${randomUUID()}`;
}

async function createRoom(capacity = 10) {
  const room = await repository.create({ name: uniqueName(), capacity });
  createdRoomIds.push(room.id);
  return room;
}

describe('rooms repository', () => {
  afterAll(async () => {
    await pool.query('DELETE FROM rooms WHERE id = ANY($1)', [createdRoomIds]);
    await pool.query('DELETE FROM users WHERE id = ANY($1)', [createdUserIds]);
    await pool.end();
  });

  it('creates a room with optional fields as null and active by default', async () => {
    const room = await createRoom(30);

    expect(room).toEqual({
      id: expect.any(String),
      name: room.name,
      capacity: 30,
      location: null,
      description: null,
      active: true,
      createdById: null,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it('finds rooms by id, by name ignoring case and in the full list', async () => {
    const room = await createRoom();

    expect(await repository.findById(room.id)).toEqual(room);
    expect(await repository.findByName(room.name.toUpperCase())).toEqual(room);
    expect(await repository.findAll()).toContainEqual(room);
    expect(await repository.findById(randomUUID())).toBeNull();
  });

  it('updates only the given fields and refreshes updatedAt', async () => {
    const room = await createRoom(10);

    const updated = await repository.update(room.id, {
      capacity: 25,
      location: 'Bloco B',
      active: false,
    });

    expect(updated).toMatchObject({
      name: room.name,
      capacity: 25,
      location: 'Bloco B',
      active: false,
    });
    expect(updated!.updatedAt.getTime()).toBeGreaterThan(
      room.updatedAt.getTime(),
    );
    expect(await repository.update(randomUUID(), { capacity: 5 })).toBeNull();
  });

  it('removes a room and reports whether it existed', async () => {
    const room = await createRoom();

    expect(await repository.remove(room.id)).toBe(true);
    expect(await repository.findById(room.id)).toBeNull();
    expect(await repository.remove(room.id)).toBe(false);
  });

  it('enforces unique names ignoring case and a positive capacity', async () => {
    const room = await createRoom();

    await expect(
      repository.create({ name: room.name.toLowerCase(), capacity: 5 }),
    ).rejects.toMatchObject({ code: '23505' });
    await expect(
      repository.create({ name: uniqueName(), capacity: 0 }),
    ).rejects.toMatchObject({ code: '23514' });
  });

  it('keeps the room when its creator is deleted', async () => {
    const user = await createUsersRepository(pool).create({
      name: 'Admin',
      email: `admin-${randomUUID()}@e2e.test`,
      passwordHash: 'h',
      role: 'admin',
    });
    createdUserIds.push(user.id);
    const room = await repository.create({
      name: uniqueName(),
      capacity: 8,
      createdById: user.id,
    });
    createdRoomIds.push(room.id);

    await pool.query('DELETE FROM users WHERE id = $1', [user.id]);

    expect(await repository.findById(room.id)).toMatchObject({
      createdById: null,
    });
  });
});
