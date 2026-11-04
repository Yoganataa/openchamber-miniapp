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
  label: 'Conflicting host identity',
  serverId: 'server_02',
  candidates: [{
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
  }],
}), null);

assert.equal(normalizeInstanceInput({
  label: 'Too many',
  candidates: Array.from({ length: 13 }, () => directCandidate),
}), null);


const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isRichText = (value) => {
  if (typeof value === 'string') return true;
  if (Array.isArray(value)) return value.every(isRichText);
  return isRecord(value) && value.type === 'bold' && isRichText(value.text);
};

const validateRichBlock = (block, depth = 1) => {
  assert.ok(depth <= 16, 'RichMessage nesting must stay within Telegram limits');
  assert.ok(isRecord(block), 'Every RichMessage block must be an object');

  switch (block.type) {
    case 'paragraph':
    case 'footer':
    case 'expandable_blockquote':
      assert.ok(isRichText(block.text), `${block.type} requires valid RichText`);
      return 1;
    case 'heading':
      assert.ok(Number.isInteger(block.size) && block.size >= 1 && block.size <= 6);
      assert.ok(isRichText(block.text));
      return 1;
    case 'divider':
      return 1;
    case 'table':
      assert.ok(Array.isArray(block.cells) && block.cells.length > 0);
      assert.equal(typeof block.is_compact, 'boolean');
      assert.equal(typeof block.is_bordered, 'boolean');
      for (const row of block.cells) {
        assert.ok(Array.isArray(row) && row.length > 0);
        for (const cell of row) {
          assert.ok(isRecord(cell));
          assert.ok(isRichText(cell.text));
          if (cell.is_header !== undefined) assert.equal(cell.is_header, true);
        }
      }
      return 1;
    case 'list': {
      assert.ok(Array.isArray(block.items) && block.items.length > 0);
      let nestedCount = 1;
      for (const item of block.items) {
        assert.ok(isRecord(item) && Array.isArray(item.blocks) && item.blocks.length > 0);
        if (item.value !== undefined) assert.ok(Number.isInteger(item.value));
        if (item.type !== undefined) assert.ok(['a', 'A', 'i', 'I', '1'].includes(item.type));
        for (const child of item.blocks) nestedCount += validateRichBlock(child, depth + 1);
      }
      return nestedCount;
    }
    case 'details': {
      assert.ok(isRichText(block.summary));
      assert.ok(Array.isArray(block.blocks) && block.blocks.length > 0);
      return 1 + block.blocks.reduce((count, child) => count + validateRichBlock(child, depth + 1), 0);
    }
    case 'buttons': {
      assert.ok(Array.isArray(block.buttons) && block.buttons.length >= 1 && block.buttons.length <= 8);
      assert.ok(['left', 'center', 'right'].includes(block.align));
      const actions = ['url', 'callback_data', 'web_app', 'login_url', 'switch_inline_query',
        'switch_inline_query_current_chat', 'switch_inline_query_chosen_chat', 'copy_text', 'disabled'];
      for (const button of block.buttons) {
        assert.ok(isRecord(button) && typeof button.text === 'string');
        assert.ok(button.style === undefined || ['danger', 'success', 'primary', 'link'].includes(button.style));
        assert.equal(actions.filter((action) => button[action] !== undefined).length, 1,
          'RichMessageButton must specify exactly one action');
      }
      return 1;
    }
    default:
      assert.fail(`Unsupported RichMessage block type: ${String(block.type)}`);
  }
};

const validateRichMessage = (richMessage) => {
  assert.deepEqual(Object.keys(richMessage), ['blocks'],
    'InputRichMessage must specify exactly one content representation');
  assert.ok(Array.isArray(richMessage.blocks) && richMessage.blocks.length > 0);
  const count = richMessage.blocks.reduce((total, block) => total + validateRichBlock(block), 0);
  assert.ok(count <= 500, 'RichMessage block count must stay within Telegram limits');
};

const welcome = buildWelcomeRichMessage({ firstName: 'Nata', hasInstance: false });
const migrationWelcome = buildWelcomeRichMessage({
  firstName: 'Nata',
  hasInstance: false,
  databaseReady: false,
});
validateRichMessage(welcome);
validateRichMessage(migrationWelcome);
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
const telegramBridge = await readFile(new URL('../src/vite/telegram-back-button-plugin.ts', import.meta.url), 'utf8');
assert.match(telegramBridge, /RUNTIME_FETCH_SUFFIX/);
assert.match(telegramBridge, /credentials: 'omit' as const/);
assert.match(hostEntry, /sharedRelayIdentity/);
assert.match(hostEntry, /local\.id === instance\.instanceId/);
assert.doesNotMatch(hostEntry, /if \(!isRecord\(local\) \|\| local\.id !== instance\.instanceId\)/);
assert.doesNotMatch(saveEndpoint, /clientToken/);
assert.match(handler, /api\.sendRichMessage/);
assert.match(handler, /message\?\.chat\?\.type !== 'private'/);
assert.match(handler, /isStartCommand\(message\.text\)/);

process.stdout.write('✓ Serverless account ownership and Bot API 10.3 RichMessage contracts validated.\n');
