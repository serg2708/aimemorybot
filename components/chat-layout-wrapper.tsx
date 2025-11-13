'use client';

import type { ReactNode } from 'react';
import { DataStreamProvider } from '@/components/data-stream-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import type { User } from 'next-auth';

interface ChatLayoutWrapperProps {
  children: ReactNode;
  user: User | undefined;
  isCollapsed: boolean;
}

export function ChatLayoutWrapper({ children, user, isCollapsed }: ChatLayoutWrapperProps) {
  return (
    <DataStreamProvider>
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={user} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </DataStreamProvider>
  );
}
