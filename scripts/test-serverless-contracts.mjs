import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { normalizeInstanceInput } from '../tgcloud/lib/instance-input.js';
import { buildWelcomeRichMessage } from '../tgcloud/lib/start-message.js';

const directCandidate = { kind: 'direct', url: 'https://openchamber.example/' };
const relayCandidate = {
  kind: 'relay',
  relay: {
    relayUrl: 'wss://relay.example/ws',
    serverId: 'server_01',
    hostEncPubJwk: {
      kty: 'EC',
      crv: 'P-256',
      x: 'abc',
      y: 'def',
    },
  },
};

const normalized = normalizeInstanceInput({
  label: 'Home Server',
  serverId: 'server_01',
  candidates: [directCandidate, relayCandidate],
});

assert.deepEqual(normalized, {
  label: 'Home Server',
  serverId: 'server_01',
  candidates: [
    { kind: 'direct', url: 'https://openchamber.example' },
    relayCandidate,
  ],
});
assert.equal(Object.hasOwn(normalized, 'clientToken'), false);
assert.equal(Object.hasOwn(normalized, 'instanceId'), false);

assert.equal(normalizeInstanceInput({
  label: 'Credential URL',
  candidates: [{ kind: 'direct', url: 'https://user:password@host.example' }],
}), null);

assert.equal(normalizeInstanceInput({
  label: 'Query URL',
  candidates: [{ kind: 'direct', url: 'https://host.example/?token=secret' }],
}), null);

assert.equal(normalizeInstanceInput({
  label: 'Unsupported URL',
  candidates: [{ kind: 'direct', url: 'ftp://host.example' }],
}), null);

assert.equal(normalizeInstanceInput({
  label: 'Invalid Relay Key',
  candidates: [{
    kind: 'relay',
    relay: {
      relayUrl: 'wss://relay.example/ws',
      serverId: 'server_01',
      hostEncPubJwk: { kty: 'RSA', crv: 'P-256', x: 'abc', y: 'def' },
    },
  }],
}), null);

assert.equal(normalizeInstanceInput({
  label: 'Too many',
  candidates: Array.from({ length: 13 }, () => directCandidate),
}), null);

const welcome = buildWelcomeRichMessage({ firstName: 'Nata', hasInstance: false });
const migrationWelcome = buildWelcomeRichMessage({
  firstName: 'Nata',
  hasInstance: false,
  databaseReady: false,
});
assert.ok(Array.isArray(welcome.blocks));
assert.ok(welcome.blocks.some((block) => block.type === 'heading'));
assert.ok(welcome.blocks.some((block) => block.type === 'expandable_blockquote'));
assert.ok(welcome.blocks.some((block) => block.type === 'table' && block.is_compact === true));

const flattenBlocks = (blocks) => blocks.flatMap((block) => [
  block,
  ...(Array.isArray(block.blocks) ? flattenBlocks(block.blocks) : []),
  ...(Array.isArray(block.items) ? block.items.flatMap((item) => flattenBlocks(item.blocks ?? [])) : []),
]);
const richBlocks = flattenBlocks(welcome.blocks);
const details = richBlocks.filter((block) => block.type === 'details');
const summaries = details.map((block) => block.summary);
assert.ok(summaries.includes('Ketentuan Layanan (Terms of Service)'));
assert.ok(summaries.includes('Kebijakan Privasi (Privacy Policy)'));
assert.ok(summaries.includes('FAQ — Pertanyaan yang Sering Diajukan'));
assert.ok(richBlocks.some((block) => block.type === 'buttons'));
assert.ok(richBlocks.some((block) => block.type === 'footer'));

const migrationBlocks = flattenBlocks(migrationWelcome.blocks);
assert.ok(migrationBlocks.some((block) => block.type === 'paragraph'
  && typeof block.text === 'string'
  && block.text.includes('Penyimpanan akun sedang disiapkan.')));
assert.equal(migrationBlocks.find((block) => block.type === 'buttons').buttons
  .some((button) => button.web_app), false);

const buttons = richBlocks.find((block) => block.type === 'buttons').buttons;
assert.ok(buttons.some((button) => button.web_app?.url === 'https://app8984347139.tgcloud.ai/'));
assert.ok(buttons.some((button) => button.url === 'https://github.com/Yoganataa/openchamber-miniapp'));

const [schema, getEndpoint, saveEndpoint, deleteEndpoint, handler] = await Promise.all([
  readFile(new URL('../tgcloud/schema.js', import.meta.url), 'utf8'),
  readFile(new URL('../tgcloud/endpoints/getMyInstance.js', import.meta.url), 'utf8'),
  readFile(new URL('../tgcloud/endpoints/saveMyInstance.js', import.meta.url), 'utf8'),
  readFile(new URL('../tgcloud/endpoints/deleteMyInstance.js', import.meta.url), 'utf8'),
  readFile(new URL('../tgcloud/handlers/message.js', import.meta.url), 'utf8'),
]);

assert.match(schema, /telegramUserId:\s*integer\('telegram_user_id'\)\.primaryKey\(\)/);
for (const endpoint of [getEndpoint, saveEndpoint, deleteEndpoint]) {
  assert.match(endpoint, /ctx\?\.initData\?\.user\?\.id/);
  assert.doesNotMatch(endpoint, /input\.telegramUserId|input\.userId/);
}
assert.match(saveEndpoint, /onConflictDoUpdate/);
assert.match(saveEndpoint, /instanceId:\s*crypto\.randomUUID\(\)/);

const hostEntry = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8');
assert.match(hostEntry, /sharedRelayIdentity/);
assert.match(hostEntry, /local\.id === instance\.instanceId/);
assert.doesNotMatch(hostEntry, /if \(!isRecord\(local\) \|\| local\.id !== instance\.instanceId\)/);
assert.doesNotMatch(saveEndpoint, /clientToken/);
assert.match(handler, /api\.sendRichMessage/);
assert.match(handler, /message\?\.chat\?\.type !== 'private'/);
assert.match(handler, /isStartCommand\(message\.text\)/);

process.stdout.write('✓ Serverless account ownership and Bot API 10.3 RichMessage contracts validated.\n');
