import { integer, json, sql, table, text } from 'sdk/db';

// A Telegram account owns at most one OpenChamber instance. The verified
// Telegram user ID is the primary key; device credentials are never stored here.
export const telegramInstances = table('telegram_instances', {
  telegramUserId: integer('telegram_user_id').primaryKey(),
  instanceId: text('instance_id').notNull(),
  serverId: text('server_id'),
  label: text('label').notNull(),
  candidates: json('candidates').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});
