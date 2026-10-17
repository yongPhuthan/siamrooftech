import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyDiagnostics, cursorIncludesMessage } from '../src/chat-domain.ts';

test('read cursor compares ingestion order so a late webhook stays unread', () => {
  const cursor = { createdAt: 1000, messageId: 'm-20' };
  assert.equal(cursorIncludesMessage(cursor, { createdAt: 999, messageId: 'm-99' }), true);
  assert.equal(cursorIncludesMessage(cursor, { createdAt: 1000, messageId: 'm-19' }), true);
  assert.equal(cursorIncludesMessage(cursor, { createdAt: 1000, messageId: 'm-21' }), false);
  assert.equal(cursorIncludesMessage(cursor, { createdAt: 1001, messageId: 'm-01' }), false);
});

test('diagnostics is green only when every destination is SUCCESS', () => {
  assert.equal(classifyDiagnostics([{ requestStatus: 'SUCCESS' }]), 'success');
  assert.equal(
    classifyDiagnostics([{ requestStatus: 'SUCCESS' }, { requestStatus: 'PARTIAL_SUCCESS' }]),
    'partial_success',
  );
  assert.equal(classifyDiagnostics([{ requestStatus: 'FAILED' }]), 'failure');
  assert.equal(classifyDiagnostics([{ requestStatus: 'PROCESSING' }]), 'processing');
});
