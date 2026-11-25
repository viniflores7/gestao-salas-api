function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export const environment = {
  port: Number(process.env.PORT ?? 3000),
  db: {
    host: required('DB_HOST'),
    port: Number(process.env.DB_PORT ?? 5432),
    user: required('DB_USERNAME'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
  },
};
