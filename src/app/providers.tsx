'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';

export function Providers(props: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>{props.children}</ThemeProvider>
    </AppRouterCacheProvider>
  );
}
