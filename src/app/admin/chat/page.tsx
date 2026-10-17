'use client';

import dynamic from 'next/dynamic';

const ChatAdminClient = dynamic(() => import('./ChatAdminClient'), { ssr: false });

export default function AdminChatPage() {
  return <ChatAdminClient />;
}
