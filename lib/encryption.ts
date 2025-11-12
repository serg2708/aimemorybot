/**
 * End-to-end encryption utilities for chat data
 * Uses wallet address as encryption key for privacy
 */

'use client';

import { handleError } from './error-handling';

/**
 * Derive encryption key from wallet address
 */
async function deriveKey(address: string, salt: string = 'ai-memory-box-v1'): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(address.toLowerCase() + salt);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using wallet address
 */
export async function encryptData(
  data: string,
  address: string
): Promise<string | null> {
  try {
    if (!crypto || !crypto.subtle) {
      throw new Error('Web Crypto API not available');
    }

    const key = await deriveKey(address);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );

    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    handleError(error, 'Encrypting data');
    return null;
  }
}

/**
 * Decrypt data using wallet address
 */
export async function decryptData(
  encryptedData: string,
  address: string
): Promise<string | null> {
  try {
    if (!crypto || !crypto.subtle) {
      throw new Error('Web Crypto API not available');
    }

    const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    const key = await deriveKey(address);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    handleError(error, 'Decrypting data');
    return null;
  }
}

/**
 * Check if encryption is available
 */
export function isEncryptionAvailable(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
}

/**
 * Encrypt chat messages array (for backward compatibility)
 */
export async function encryptMessages(
  messages: any[],
  address: string
): Promise<string> {
  const json = JSON.stringify(messages);
  const encrypted = await encryptData(json, address);
  if (!encrypted) {
    throw new Error('Failed to encrypt messages');
  }
  return encrypted;
}

/**
 * Decrypt chat messages array (for backward compatibility)
 */
export async function decryptMessages(
  encryptedData: string,
  address: string
): Promise<any[]> {
  const decrypted = await decryptData(encryptedData, address);
  if (!decrypted) {
    throw new Error('Failed to decrypt messages');
  }
  return JSON.parse(decrypted);
}
