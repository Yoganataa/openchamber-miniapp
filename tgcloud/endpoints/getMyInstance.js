import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { telegramInstances } from '../schema.js';

const requireTelegramUserId = (ctx) => {
  const userId = ctx?.initData?.user?.id;
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new EndpointError('Verified Telegram identity is required.', { code: 'UNAUTHORIZED' });
  }
  return userId;
};

export default async function (_input, ctx) {
  const telegramUserId = requireTelegramUserId(ctx);
  const instance = await db.select().from(telegramInstances)
    .where(eq(telegramInstances.telegramUserId, telegramUserId))
    .get();

  if (!instance) {
    return { telegramUserId, instance: null };
  }

  return {
    telegramUserId,
    instance: {
      instanceId: instance.instanceId,
      serverId: instance.serverId,
      label: instance.label,
      candidates: instance.candidates,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt,
    },
  };
}
