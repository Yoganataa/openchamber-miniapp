import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { telegramInstances } from '../schema.js';
import { buildWelcomeRichMessage } from '../lib/start-message.js';

const isStartCommand = (text) => {
  if (typeof text !== 'string') return false;
  const command = text.trim().split(/\s+/, 1)[0];
  return /^\/start(?:@[a-zA-Z0-9_]+)?$/i.test(command);
};

export default async function (message) {
  if (message?.chat?.type !== 'private' || !Number.isSafeInteger(message?.chat?.id)) return;
  if (!isStartCommand(message.text)) return;

  const telegramUserId = message.from?.id;
  if (!Number.isSafeInteger(telegramUserId) || telegramUserId <= 0) return;

  let instance = null;
  let databaseReady = true;

  try {
    instance = await db.select({ instanceId: telegramInstances.instanceId })
      .from(telegramInstances)
      .where(eq(telegramInstances.telegramUserId, telegramUserId))
      .get();
  } catch (error) {
    // Deployment and schema migration are deliberately separate. Keep /start
    // usable during that short rollout window without claiming an account has
    // no instance or directing the user into a not-yet-ready Mini App.
    databaseReady = false;
    console.error('Failed to read Telegram instance ownership state.', error);
  }

  await api.sendRichMessage({
    chat_id: message.chat.id,
    rich_message: buildWelcomeRichMessage({
      firstName: message.from.first_name,
      hasInstance: Boolean(instance),
      databaseReady,
    }),
    protect_content: true,
  });
}
