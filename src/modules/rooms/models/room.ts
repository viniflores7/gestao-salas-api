export interface Room {
  id: string;
  name: string;
  capacity: number;
  location: string | null;
  description: string | null;
  active: boolean;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoomInput {
  name: string;
  capacity: number;
  location?: string | null;
  description?: string | null;
  createdById?: string | null;
}

export type UpdateRoomInput = Partial<
  Pick<Room, 'name' | 'capacity' | 'location' | 'description' | 'active'>
>;
