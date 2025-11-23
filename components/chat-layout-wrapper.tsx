"use client";

import type { User } from "next-auth";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

interface ChatLayoutWrapperProps {
  children: ReactNode;
  user: User | undefined;
  isCollapsed: boolean;
}

export function ChatLayoutWrapper({
  children,
  user,
  isCollapsed,
}: ChatLayoutWrapperProps) {
  return (
    <DataStreamProvider>
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={user} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </DataStreamProvider>
  );
}
