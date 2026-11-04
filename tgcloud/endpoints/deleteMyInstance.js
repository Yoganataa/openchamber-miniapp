import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { telegramInstances } from '../schema.js';

export default async function (_input, ctx) {
  const telegramUserId = ctx?.initData?.user?.id;
  if (!Number.isSafeInteger(telegramUserId) || telegramUserId <= 0) {
    throw new EndpointError('Verified Telegram identity is required.', { code: 'UNAUTHORIZED' });
  }

  const result = await db.delete(telegramInstances)
    .where(eq(telegramInstances.telegramUserId, telegramUserId))
    .run();

  return { deleted: result.rowsAffected > 0 };
}
