// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const memory = vi.hoisted(() => ({ files: new Map<string, string>(), failWrite: false }));
vi.mock('fs', () => ({ default: {
  existsSync: (p: string) => p.endsWith('/data') || memory.files.has(p), mkdirSync: vi.fn(),
  readFileSync: (p: string) => memory.files.get(p),
  writeFileSync: (p: string, v: string) => { if (memory.failWrite) throw new Error('disk full'); memory.files.set(p, v); },
  renameSync: (a: string, b: string) => { memory.files.set(b, memory.files.get(a)!); memory.files.delete(a); },
  unlinkSync: (p: string) => memory.files.delete(p),
} }));
import { ServerStore } from '../server-store';
beforeEach(() => { memory.files.clear(); memory.failWrite = false; });
it('deduplicates incoming message IDs and stores a string preview', () => {
  const first = ServerStore.saveMessage({ wamid: 'unique', whatsappNumber: '123', text: { body: 'Hello' }, type: 'text' });
  const again = ServerStore.saveMessage({ wamid: 'unique', whatsappNumber: '123', text: 'Hello', type: 'text' });
  expect(again._id).toBe(first._id);
  expect(ServerStore.getMessages()).toHaveLength(1);
  expect(ServerStore.getConversations()[0].lastMessagePreview).toBe('Hello');
});
it('does not report success when disk persistence fails', () => {
  ServerStore.getMessages();
  memory.failWrite = true;
  expect(() => ServerStore.saveMessage({ text: 'Hello', whatsappNumber: '123' })).toThrow();
  expect(ServerStore.getMessages()).toHaveLength(0);
});
it('does not replace corrupted history with an empty database', () => {
  memory.files.set(`${process.cwd()}/data/whatsapp-db.json`, '{broken');
  expect(() => ServerStore.saveMessage({ text: 'Hello' })).toThrow();
  expect(memory.files.get(`${process.cwd()}/data/whatsapp-db.json`)).toBe('{broken');
});
