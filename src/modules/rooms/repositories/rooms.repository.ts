import type { Queryable } from '../../../database/queryable.ts';
import type { CreateRoomInput, Room, UpdateRoomInput } from '../models/room.ts';

const ROOM_COLUMNS = `
  id, name, capacity, location, description, active,
  created_by_id AS "createdById",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

const UPDATABLE_COLUMNS: Record<keyof UpdateRoomInput, string> = {
  name: 'name',
  capacity: 'capacity',
  location: 'location',
  description: 'description',
  active: 'active',
};

export function createRoomsRepository(db: Queryable) {
  return {
    async findAll(): Promise<Room[]> {
      const { rows } = await db.query<Room>(
        `SELECT ${ROOM_COLUMNS} FROM rooms ORDER BY name`,
      );
      return rows;
    },

    async findById(id: string): Promise<Room | null> {
      const { rows } = await db.query<Room>(
        `SELECT ${ROOM_COLUMNS} FROM rooms WHERE id = $1`,
        [id],
      );
      return rows[0] ?? null;
    },

    async findByName(name: string): Promise<Room | null> {
      const { rows } = await db.query<Room>(
        `SELECT ${ROOM_COLUMNS} FROM rooms WHERE lower(name) = lower($1)`,
        [name],
      );
      return rows[0] ?? null;
    },

    async create(input: CreateRoomInput): Promise<Room> {
      const { rows } = await db.query<Room>(
        `INSERT INTO rooms (name, capacity, location, description, created_by_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING ${ROOM_COLUMNS}`,
        [
          input.name,
          input.capacity,
          input.location ?? null,
          input.description ?? null,
          input.createdById ?? null,
        ],
      );
      return rows[0];
    },

    async update(id: string, input: UpdateRoomInput): Promise<Room | null> {
      const fields = (Object.keys(input) as (keyof UpdateRoomInput)[]).filter(
        (field) => input[field] !== undefined,
      );
      const assignments = fields.map(
        (field, index) => `${UPDATABLE_COLUMNS[field]} = $${index + 2}`,
      );
      const { rows } = await db.query<Room>(
        `UPDATE rooms
         SET ${[...assignments, 'updated_at = now()'].join(', ')}
         WHERE id = $1
         RETURNING ${ROOM_COLUMNS}`,
        [id, ...fields.map((field) => input[field])],
      );
      return rows[0] ?? null;
    },

    async remove(id: string): Promise<boolean> {
      const { rowCount } = await db.query('DELETE FROM rooms WHERE id = $1', [
        id,
      ]);
      return rowCount === 1;
    },
  };
}

export type RoomsRepository = ReturnType<typeof createRoomsRepository>;
