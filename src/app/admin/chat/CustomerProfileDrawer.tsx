'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Avatar } from './ConversationList';
import type { ConversationDetail } from './types';
import CrmConversation from '@/features/lead-crm/CrmConversation';
interface Props { detail: ConversationDetail; open: boolean; returnFocusRef: React.RefObject<HTMLButtonElement>; onClose(): void; onRefresh(): Promise<void> }
export default function CustomerProfileDrawer({ detail, open, returnFocusRef, onClose, onRefresh }: Props) {
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onClose(); returnFocusRef.current?.focus(); }
      if (event.key === 'Tab') {
        const elements = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]') ?? [])].filter((element) => element.getClientRects().length > 0);
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [open, onClose, returnFocusRef]);
  if (!open) return null;
  return <div className="absolute inset-0 z-30 flex justify-end bg-slate-950/20" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside ref={dialog} className="flex h-full w-full flex-col bg-white shadow-2xl md:w-[560px]" role="dialog" aria-modal="true" aria-label="ข้อมูลลูกค้า">
      <header className="flex items-center gap-3 border-b p-4"><Avatar name={detail.conversation.display_name} src={detail.conversation.picture_url} size="lg" />
        <h2 className="min-w-0 flex-1 truncate text-lg font-semibold">{detail.conversation.display_name}</h2>
        <button className="rounded-lg p-2 hover:bg-slate-100" type="button" onClick={onClose} aria-label="ปิดข้อมูลลูกค้า"><X className="h-5 w-5" /></button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4"><CrmConversation key={detail.conversation.conversation_id} conversationId={detail.conversation.conversation_id} onRefresh={onRefresh} /></div>
    </aside>
  </div>;
}
