import path from 'path';

interface Env {
  (key: string, defaultValue?: string): string;
  int(key: string, defaultValue?: number): number;
  bool(key: string, defaultValue?: boolean): boolean;
}

// eslint-disable-next-line import/no-anonymous-default-export
export default ({ env }: { env: Env }) => {
  const client = env('DATABASE_CLIENT', 'sqlite') as 'sqlite';

  const connections = {
    sqlite: {
      connector: 'bookshelf',
      settings: {
        client: 'sqlite',
        filename: path.join(__dirname, '..', '..', env('DATABASE_FILENAME', 'data.db')),
      },
      options: {
        useNullAsDefault: true,
      },
    },
    // Add other database clients here
  };

  return {
    connection: {
      client,
      connection: connections[client],
      useNullAsDefault: client === 'sqlite',
    },
  };
};