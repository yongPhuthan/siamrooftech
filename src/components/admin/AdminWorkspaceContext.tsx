'use client';

import { createContext, useContext } from 'react';

interface AdminWorkspaceContextValue {
  workspaceMode: 'default' | 'article-editor';
  setWorkspaceMode: (mode: 'default' | 'article-editor') => void;
}

const AdminWorkspaceContext = createContext<AdminWorkspaceContextValue>({
  workspaceMode: 'default',
  setWorkspaceMode: () => undefined,
});

export const AdminWorkspaceProvider = AdminWorkspaceContext.Provider;

export function useAdminWorkspace() {
  return useContext(AdminWorkspaceContext);
}
