/**
 * Footer component
 * Displayed at the bottom of all pages
 */

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 py-8 dark:border-gray-700 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Copyright */}
          <div className="text-gray-600 text-sm dark:text-gray-400">
            © 2024 AI Memory Box. All rights reserved.
          </div>

          {/* Navigation Links */}
          <div className="flex gap-6 text-sm">
            <Link
              className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              href="/pricing"
            >
              Pricing
            </Link>
            <Link
              className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              href="/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              href="/chat"
            >
              Chat
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
