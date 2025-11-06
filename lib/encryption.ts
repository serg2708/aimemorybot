/**
 * Encryption utilities for AI Memory Box
 * Uses Web Crypto API for secure client-side encryption
 */

export interface EncryptedData {
  encrypted: string;
  iv: string;
  salt: string;
}

/**
 * Derive a key from a password using PBKDF2
 */
async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const importedKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data with AES-GCM using a password
 */
export async function encrypt(
  data: string,
  password: string
): Promise<EncryptedData> {
  try {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive key from password
    const key = await deriveKey(password, salt);

    // Encode data
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      dataBuffer
    );

    // Convert to base64
    return {
      encrypted: bufferToBase64(encryptedBuffer),
      iv: bufferToBase64(iv),
      salt: bufferToBase64(salt),
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data with AES-GCM using a password
 */
export async function decrypt(
  encryptedData: EncryptedData,
  password: string
): Promise<string> {
  try {
    // Convert from base64
    const salt = base64ToBuffer(encryptedData.salt);
    const iv = base64ToBuffer(encryptedData.iv);
    const encrypted = base64ToBuffer(encryptedData.encrypted);

    // Derive key from password
    const key = await deriveKey(password, salt);

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encrypted
    );

    // Decode data
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data - wrong password or corrupted data');
  }
}

/**
 * Generate a deterministic password from wallet address
 * This allows the same encryption key across sessions without storing it
 */
export function generatePasswordFromAddress(address: string): string {
  // In production, you might want to ask users for an additional passphrase
  // for extra security. This is a simple deterministic approach.
  return `aimemorybox_${address.toLowerCase()}_encryption_key`;
}

/**
 * Encrypt messages for storage
 */
export async function encryptMessages(
  messages: any[],
  address: string
): Promise<string> {
  const password = generatePasswordFromAddress(address);
  const data = JSON.stringify(messages);
  const encrypted = await encrypt(data, password);
  return JSON.stringify(encrypted);
}

/**
 * Decrypt messages from storage
 */
export async function decryptMessages(
  encryptedData: string,
  address: string
): Promise<any[]> {
  const password = generatePasswordFromAddress(address);
  const encrypted: EncryptedData = JSON.parse(encryptedData);
  const decrypted = await decrypt(encrypted, password);
  return JSON.parse(decrypted);
}

/**
 * Hash data with SHA-256 (useful for creating content IDs)
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return bufferToBase64(hashBuffer);
}

// Helper functions for base64 conversion
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Check if encryption is available in the current environment
 */
export function isEncryptionAvailable(): boolean {
  return (
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined' &&
    typeof crypto.getRandomValues !== 'undefined'
  );
}
