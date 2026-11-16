'use client';

import { AlertCircle, Image as ImageIcon, Search } from 'lucide-react';
import { Avatar } from '@/components/admin/CustomerAvatar';
import { LEAD_STAGE, formatChatTime } from './chat-ui';
import type { ConversationSummary } from './types';

interface Props {
  conversations: ConversationSummary[];
  selectedId: string | null;
  query: string;
  filter: string;
  loading: boolean;
  onQueryChange(value: string): void;
  onFilterChange(value: string): void;
  onSelect(conversation: ConversationSummary): void;
}

export default function ConversationList(props: Props) {
  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-r border-slate-200 bg-white md:w-80">
      <div className="border-b border-slate-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-950">แชท LINE</h1>
            <p className="text-xs text-slate-500">{props.conversations.length} การสนทนา</p>
          </div>
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" title="เชื่อมต่อแล้ว" />
        </div>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
          <span className="sr-only">ค้นหาการสนทนา</span>
          <input
            value={props.query}
            onChange={(event) => props.onQueryChange(event.target.value)}
            placeholder="ชื่อ, ref, campaign, keyword, GCLID"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <div className="mt-3 flex gap-1" role="tablist" aria-label="ตัวกรองการสนทนา">
          {[
            ['all', 'ทั้งหมด'],
            ['unread', 'ยังไม่ได้อ่าน'],
            ['attention', 'ต้องจัดการ'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={props.filter === value}
              onClick={() => props.onFilterChange(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                props.filter === value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto" aria-live="polite">
        {props.loading && props.conversations.length === 0 ? (
          <div className="space-y-3 p-4" aria-label="กำลังโหลด">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : props.conversations.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">ไม่พบการสนทนา</p>
        ) : (
          props.conversations.map((conversation) => {
            const stage = conversation.active_lead ? LEAD_STAGE[conversation.active_lead.status] : null;
            const selected = props.selectedId === conversation.conversation_id;
            return (
              <button
                key={conversation.conversation_id}
                type="button"
                onClick={() => props.onSelect(conversation)}
                className={`group flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition ${
                  selected ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                }`}
              >
                <Avatar name={conversation.display_name} src={conversation.picture_url} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className={`truncate text-sm ${conversation.unread_count ? 'font-semibold text-slate-950' : 'font-medium text-slate-800'}`}>
                      {conversation.display_name}
                    </span>
                    <span className="shrink-0 text-[11px] text-slate-400">{formatChatTime(conversation.last_event_at)}</span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    {conversation.latest_message?.type === 'image' && <ImageIcon className="h-3 w-3" aria-hidden="true" />}
                    <span className="truncate">
                      {conversation.latest_message?.text || (conversation.latest_message?.type === 'image' ? 'รูปภาพ' : 'ยังไม่มีข้อความ')}
                    </span>
                  </span>
                  <span className="mt-2 flex items-center gap-2">
                    {stage ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${stage.className}`}>{stage.label}</span> : <span className="text-[10px] text-slate-400">ยังไม่ผูก Lead</span>}
                    {conversation.attention_reason && <AlertCircle className="h-3.5 w-3.5 text-amber-500" aria-label="ต้องจัดการ" />}
                    {conversation.unread_count > 0 && <span className="ml-auto min-w-5 rounded-full bg-blue-600 px-1.5 py-0.5 text-center text-[10px] font-semibold text-white">{conversation.unread_count}</span>}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}

export { Avatar } from '@/components/admin/CustomerAvatar';
