import { cookies } from "next/headers";
import Script from "next/script";
import { ChatLayoutWrapper } from "@/components/chat-layout-wrapper";
import { auth } from "../(auth)/auth";

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <ChatLayoutWrapper user={session?.user} isCollapsed={isCollapsed}>
        {children}
      </ChatLayoutWrapper>
    </>
  );
}
