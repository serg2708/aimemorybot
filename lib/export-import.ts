/**
 * Export and import utilities for chat data
 * Supports JSON, Markdown, and PDF formats
 */

"use client";

import type { ChatSession } from "./chat-persistence";
import { handleError } from "./error-handling";
import {
  notifyExportCompleted,
  notifyExportFailed,
  notifyExportStarted,
  notifySuccess,
} from "./notifications";

/**
 * Export format types
 */
export type ExportFormat = "json" | "markdown" | "txt";

/**
 * Export chat to JSON
 */
export function exportToJSON(chat: ChatSession): string {
  return JSON.stringify(chat, null, 2);
}

/**
 * Export chat to Markdown
 */
export function exportToMarkdown(chat: ChatSession): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${chat.title}`);
  lines.push("");
  lines.push(`Created: ${new Date(chat.createdAt).toLocaleString()}`);
  lines.push(`Last Updated: ${new Date(chat.updatedAt).toLocaleString()}`);
  lines.push(`Messages: ${chat.messages.length}`);
  if (chat.cid) {
    lines.push(`CID: ${chat.cid}`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  // Messages
  chat.messages.forEach((message, index) => {
    const role = message.role.charAt(0).toUpperCase() + message.role.slice(1);
    const timestamp = new Date(message.timestamp).toLocaleString();

    lines.push(`## ${role} (${timestamp})`);
    lines.push("");
    lines.push(message.content);
    lines.push("");

    if (index < chat.messages.length - 1) {
      lines.push("---");
      lines.push("");
    }
  });

  return lines.join("\n");
}

/**
 * Export chat to plain text
 */
export function exportToText(chat: ChatSession): string {
  const lines: string[] = [];

  // Header
  lines.push(`${chat.title}`);
  lines.push("=".repeat(chat.title.length));
  lines.push("");
  lines.push(`Created: ${new Date(chat.createdAt).toLocaleString()}`);
  lines.push(`Last Updated: ${new Date(chat.updatedAt).toLocaleString()}`);
  lines.push(`Messages: ${chat.messages.length}`);
  if (chat.cid) {
    lines.push(`CID: ${chat.cid}`);
  }
  lines.push("");
  lines.push("-".repeat(50));
  lines.push("");

  // Messages
  chat.messages.forEach((message) => {
    const role = message.role.toUpperCase();
    const timestamp = new Date(message.timestamp).toLocaleString();

    lines.push(`[${role}] ${timestamp}`);
    lines.push(message.content);
    lines.push("");
  });

  return lines.join("\n");
}

/**
 * Download file to user's computer
 */
function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export single chat
 */
export async function exportChat(
  chat: ChatSession,
  format: ExportFormat = "json"
): Promise<void> {
  try {
    notifyExportStarted(format);

    let content: string;
    let filename: string;
    let mimeType: string;

    const safeTitle = chat.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const timestamp = new Date().toISOString().split("T")[0];

    switch (format) {
      case "json":
        content = exportToJSON(chat);
        filename = `${safeTitle}_${timestamp}.json`;
        mimeType = "application/json";
        break;

      case "markdown":
        content = exportToMarkdown(chat);
        filename = `${safeTitle}_${timestamp}.md`;
        mimeType = "text/markdown";
        break;

      case "txt":
        content = exportToText(chat);
        filename = `${safeTitle}_${timestamp}.txt`;
        mimeType = "text/plain";
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    downloadFile(content, filename, mimeType);
    notifyExportCompleted();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    notifyExportFailed(errorMsg);
    handleError(error, "Exporting chat");
  }
}

/**
 * Export multiple chats
 */
export async function exportMultipleChats(
  chats: ChatSession[],
  format: ExportFormat = "json"
): Promise<void> {
  try {
    notifyExportStarted(format);

    if (chats.length === 0) {
      throw new Error("No chats to export");
    }

    const timestamp = new Date().toISOString().split("T")[0];

    if (format === "json") {
      // Export as single JSON file with all chats
      const content = JSON.stringify(chats, null, 2);
      const filename = `all_chats_${timestamp}.json`;
      downloadFile(content, filename, "application/json");
    } else {
      // Export each chat as separate file
      for (const chat of chats) {
        await exportChat(chat, format);
      }
    }

    notifyExportCompleted();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    notifyExportFailed(errorMsg);
    handleError(error, "Exporting chats");
  }
}

/**
 * Import chat from JSON
 */
export function importFromJSON(jsonData: string): ChatSession {
  try {
    const parsed = JSON.parse(jsonData);

    // Validate required fields
    if (!parsed.id || !Array.isArray(parsed.messages)) {
      throw new Error("Invalid chat data: missing required fields");
    }

    // Ensure all messages have required fields
    for (const message of parsed.messages) {
      if (!message.id || !message.role || !message.content) {
        throw new Error("Invalid message data: missing required fields");
      }
    }

    return parsed as ChatSession;
  } catch (error) {
    throw new Error(
      `Failed to import chat: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Import multiple chats from JSON
 */
export function importMultipleFromJSON(jsonData: string): ChatSession[] {
  try {
    const parsed = JSON.parse(jsonData);

    if (!Array.isArray(parsed)) {
      // Single chat
      return [importFromJSON(jsonData)];
    }

    // Multiple chats
    return parsed.map((chatData) => {
      if (!chatData.id || !Array.isArray(chatData.messages)) {
        throw new Error("Invalid chat data in array");
      }
      return chatData as ChatSession;
    });
  } catch (error) {
    throw new Error(
      `Failed to import chats: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Handle file upload for import
 */
export async function handleFileImport(file: File): Promise<ChatSession[]> {
  try {
    if (!file.name.endsWith(".json")) {
      throw new Error("Only JSON files are supported for import");
    }

    const text = await file.text();
    const chats = importMultipleFromJSON(text);

    notifySuccess(`Successfully imported ${chats.length} chat(s)`);
    return chats;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    handleError(error, "Importing file");
    throw error;
  }
}

/**
 * Export all data (chats + settings)
 */
export async function exportAllData(): Promise<void> {
  try {
    notifyExportStarted("json");

    const data = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      chats: [] as ChatSession[],
      // Can add more data here: settings, preferences, etc.
    };

    // Get all chats from localStorage
    const storedChats = localStorage.getItem("ai_memory_box_chats");
    if (storedChats) {
      data.chats = JSON.parse(storedChats);
    }

    const content = JSON.stringify(data, null, 2);
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `ai_memory_box_backup_${timestamp}.json`;

    downloadFile(content, filename, "application/json");
    notifyExportCompleted();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    notifyExportFailed(errorMsg);
    handleError(error, "Exporting all data");
  }
}

/**
 * Import all data (chats + settings)
 */
export async function importAllData(file: File): Promise<{
  chats: ChatSession[];
  version: string;
}> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.version || !data.chats) {
      throw new Error("Invalid backup file format");
    }

    notifySuccess(`Successfully imported backup (${data.chats.length} chats)`);

    return {
      chats: data.chats,
      version: data.version,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    handleError(error, "Importing backup");
    throw error;
  }
}
