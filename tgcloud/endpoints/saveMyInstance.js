import { db, EndpointError } from 'sdk';
import { eq, sql } from 'sdk/db';
import { telegramInstances } from '../schema.js';
import { normalizeInstanceInput } from '../lib/instance-input.js';

const requireTelegramUserId = (ctx) => {
  const userId = ctx?.initData?.user?.id;
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new EndpointError('Verified Telegram identity is required.', { code: 'UNAUTHORIZED' });
  }
  return userId;
};

export default async function (input, ctx) {
  const telegramUserId = requireTelegramUserId(ctx);
  const normalized = normalizeInstanceInput(input);

  if (!normalized) {
    throw new EndpointError('Invalid OpenChamber instance metadata.', { code: 'INVALID_INSTANCE' });
  }

  await db.insert(telegramInstances).values({
    telegramUserId,
    instanceId: normalized.instanceId,
    serverId: normalized.serverId,
    label: normalized.label,
    candidates: normalized.candidates,
  }).onConflictDoUpdate({
    target: telegramInstances.telegramUserId,
    set: {
      instanceId: normalized.instanceId,
      serverId: normalized.serverId,
      label: normalized.label,
      candidates: normalized.candidates,
      updatedAt: sql`(unixepoch())`,
    },
  }).run();

  return {
    saved: true,
    instanceId: normalized.instanceId,
  };
}
