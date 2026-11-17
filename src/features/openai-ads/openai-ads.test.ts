import { describe, expect, it, vi } from 'vitest';
import { buildPixelBootstrap, isValidCustomEventName, normalizePixelId } from './pixel-config';
import { buildConversionsBody, sendConversions } from './conversions-api';

describe('OpenAI Pixel config', () => {
  it('accepts only safe pixel IDs', () => {
    expect(normalizePixelId(' px_ABC-123 ')).toBe('px_ABC-123');
    expect(normalizePixelId('')).toBeNull();
    expect(normalizePixelId(undefined)).toBeNull();
    expect(normalizePixelId('a"});alert(1);//')).toBeNull();
  });

  it('builds the official loader with a JSON-encoded pixel ID', () => {
    const script = buildPixelBootstrap('px_123');
    expect(script).toContain('"https://bzrcdn.openai.com/sdk/oaiq.min.js"');
    expect(script).toContain('oaiq("init",{pixelId:"px_123"})');
    expect(() => buildPixelBootstrap('<bad>')).toThrow();
  });

  it('enforces custom event naming rules', () => {
    expect(isValidCustomEventName('line_click')).toBe(true);
    expect(isValidCustomEventName('lead_created')).toBe(false);
    expect(isValidCustomEventName('Line_Click')).toBe(false);
    expect(isValidCustomEventName('_line')).toBe(false);
  });
});

describe('OpenAI Conversions API payloads', () => {
  const lead = { id: 'lead_1', type: 'lead_created' as const, timestampMs: 1_763_000_000_000 };

  it('defaults to validate_only and maps lead_created to customer_action', () => {
    const body = buildConversionsBody([{ ...lead, amount: 150000, currency: 'THB', oppref: 'abc' }]);
    expect(body.validate_only).toBe(true);
    expect(body.events[0]).toEqual({
      id: 'lead_1', type: 'lead_created', timestamp_ms: 1_763_000_000_000, action_source: 'web',
      oppref: 'abc', data: { type: 'customer_action', amount: 150000, currency: 'THB' },
    });
  });

  it('omits validate_only only on explicit live opt-in', () => {
    expect('validate_only' in buildConversionsBody([lead], { live: true })).toBe(false);
  });

  it('rejects the whole batch when one event is invalid', () => {
    expect(() => buildConversionsBody([lead, { ...lead, amount: 1.5, currency: 'THB' }])).toThrow();
    expect(() => buildConversionsBody([{ ...lead, type: 'custom' }])).toThrow();
    expect(() => buildConversionsBody([])).toThrow();
  });

  it('does not call the network without configuration', async () => {
    const fetchImpl = vi.fn();
    const result = await sendConversions({ pixelId: '', apiKey: '' }, [lead], { fetchImpl });
    expect(result.ok).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('posts to the pixel endpoint with a bearer key', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const result = await sendConversions({ pixelId: 'px_1', apiKey: 'test-key' }, [lead], { fetchImpl });
    expect(result).toEqual({ ok: true, status: 200, validateOnly: true });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://bzr.openai.com/v1/events?pid=px_1');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer test-key');
    expect(JSON.parse(init.body as string).validate_only).toBe(true);
  });
});
