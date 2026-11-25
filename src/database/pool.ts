import pg from 'pg';
import { environment } from '../config/environment.ts';

export const pool = new pg.Pool(environment.db);
