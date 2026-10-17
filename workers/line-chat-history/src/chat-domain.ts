export interface ReceiveCursor {
  createdAt: number;
  messageId: string;
}

export function cursorIncludesMessage(cursor: ReceiveCursor, message: ReceiveCursor): boolean {
  return (
    message.createdAt < cursor.createdAt ||
    (message.createdAt === cursor.createdAt && message.messageId <= cursor.messageId)
  );
}

export type DiagnosticsState = 'processing' | 'success' | 'partial_success' | 'failure';

export function classifyDiagnostics(
  destinations: Array<{ requestStatus?: string }>,
): DiagnosticsState {
  const statuses = destinations.map((destination) => destination.requestStatus ?? 'PROCESSING');
  if (statuses.length > 0 && statuses.every((status) => status === 'SUCCESS')) return 'success';
  if (statuses.some((status) => status === 'FAILED' || status === 'FAILURE')) return 'failure';
  if (statuses.some((status) => status === 'PARTIAL_SUCCESS')) return 'partial_success';
  return 'processing';
}

export function encodeReceiveCursor(cursor: ReceiveCursor): string {
  return btoa(JSON.stringify(cursor));
}

export function decodeReceiveCursor(raw: string): ReceiveCursor | null {
  try {
    const parsed = JSON.parse(atob(raw)) as Partial<ReceiveCursor>;
    if (typeof parsed.createdAt !== 'number' || typeof parsed.messageId !== 'string') return null;
    return { createdAt: parsed.createdAt, messageId: parsed.messageId };
  } catch {
    return null;
  }
}
