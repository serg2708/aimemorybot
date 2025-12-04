import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { ClientProviders } from "@/components/client-providers";
import { SessionProviderWrapper } from "@/components/session-provider-wrapper";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://aimemorybox.com"),
  title: "AI Memory Box - Chat with Permanent Blockchain Memory",
  description:
    "AI-powered chat with permanent memory stored on Autonomys blockchain. Your conversations, encrypted and preserved forever.",
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const geist = GeistSans;
const geistMono = GeistMono;

const LIGHT_THEME_COLOR = "hsl(0 0% 100%)";
const DARK_THEME_COLOR = "hsl(240deg 10% 3.92%)";
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

// Script to suppress known wallet extension conflicts
const WALLET_ERROR_SUPPRESSION_SCRIPT = `\
(function() {
  // Suppress known wallet extension errors
  var originalError = console.error;
  console.error = function() {
    var args = Array.prototype.slice.call(arguments);
    var message = args.join(' ');

    // List of known wallet extension conflict messages to suppress
    var suppressPatterns = [
      'Cannot set property ethereum',
      'Cannot redefine property: ethereum',
      'Failed to assign ethereum proxy',
      'Invalid property descriptor',
      'Talisman extension has not been configured',
      'MetaMask encountered an error setting the global Ethereum provider'
    ];

    // Check if error message matches any suppression pattern
    var shouldSuppress = suppressPatterns.some(function(pattern) {
      return message.indexOf(pattern) !== -1;
    });

    // Only log if not suppressed
    if (!shouldSuppress) {
      originalError.apply(console, args);
    }
  };
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geist.variable} ${geistMono.variable}`}
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required"
          dangerouslySetInnerHTML={{
            __html: WALLET_ERROR_SUPPRESSION_SCRIPT,
          }}
        />
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required"
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <SessionProviderWrapper>
          <ClientProviders>
            <Toaster position="top-center" />
            {children}
          </ClientProviders>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
