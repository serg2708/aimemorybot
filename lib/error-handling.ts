/**
 * Error handling utilities with retry logic
 * Provides exponential backoff, custom error types, and retry mechanisms
 */

import {
  dismissNotification,
  notifyError,
  notifyLoading,
} from "./notifications";

/**
 * Custom error types
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class TransactionError extends Error {
  constructor(
    message: string,
    public txHash?: string
  ) {
    super(message);
    this.name = "TransactionError";
  }
}

export class InsufficientBalanceError extends Error {
  constructor(
    message: string,
    public required?: string,
    public current?: string
  ) {
    super(message);
    this.name = "InsufficientBalanceError";
  }
}

export class DSNError extends Error {
  constructor(
    message: string,
    public cid?: string
  ) {
    super(message);
    this.name = "DSNError";
  }
}

export class WalletError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "WalletError";
  }
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10_000, // 10 seconds
  backoffMultiplier: 2,
  shouldRetry: (error: Error) => {
    // Retry on network errors, but not on user rejections or insufficient balance
    if (error instanceof WalletError && error.code === "ACTION_REJECTED") {
      return false;
    }
    if (error instanceof InsufficientBalanceError) {
      return false;
    }
    return true;
  },
  onRetry: () => {},
};

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  config: Required<RetryConfig>
): number {
  const delay = config.initialDelay * config.backoffMultiplier ** (attempt - 1);
  return Math.min(delay, config.maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      const isLastAttempt = attempt === finalConfig.maxAttempts;
      const shouldRetry = finalConfig.shouldRetry(lastError, attempt);

      if (isLastAttempt || !shouldRetry) {
        throw lastError;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, finalConfig);
      finalConfig.onRetry(lastError, attempt);

      await sleep(delay);
    }
  }

  throw lastError || new Error("Retry failed with unknown error");
}

/**
 * Parse error message from various error types
 */
export function parseErrorMessage(error: unknown): string {
  if (!error) return "Unknown error occurred";

  if (typeof error === "string") return error;

  if (error instanceof Error) {
    // Handle specific error types
    if (
      error.name === "ACTION_REJECTED" ||
      error.message.includes("User rejected")
    ) {
      return "Transaction rejected by user";
    }

    if (error.message.includes("insufficient funds")) {
      return "Insufficient funds for transaction";
    }

    if (error.message.includes("network")) {
      return "Network error. Please check your connection";
    }

    return error.message;
  }

  // Handle object with message property
  if (typeof error === "object" && error !== null) {
    const err = error as any;
    if ("message" in err) return String(err.message);
    if ("reason" in err) return String(err.reason);
    if ("error" in err) return parseErrorMessage(err.error);
  }

  return "An unexpected error occurred";
}

/**
 * Handle error and show notification
 */
export function handleError(error: unknown, context?: string): void {
  const message = parseErrorMessage(error);
  const fullMessage = context ? `${context}: ${message}` : message;

  console.error(fullMessage, error);
  notifyError(fullMessage);
}

/**
 * Retry wrapper for transactions with user feedback
 */
export async function retryTransaction<T>(
  operation: () => Promise<T>,
  operationName = "Transaction"
): Promise<T> {
  const notificationId = `retry-${Date.now()}`;

  return withRetry(operation, {
    maxAttempts: 3,
    initialDelay: 2000,
    maxDelay: 8000,
    onRetry: (error, attempt) => {
      console.warn(`${operationName} failed (attempt ${attempt}):`, error);
      notifyLoading(
        `${operationName} failed. Retrying... (${attempt}/3)`,
        notificationId
      );
    },
    shouldRetry: (error) => {
      // Don't retry on user rejection
      if (parseErrorMessage(error).includes("rejected")) {
        dismissNotification(notificationId);
        return false;
      }
      return true;
    },
  }).finally(() => {
    dismissNotification(notificationId);
  });
}

/**
 * Retry wrapper for DSN operations
 */
export async function retryDSNOperation<T>(
  operation: () => Promise<T>,
  operationName = "DSN operation"
): Promise<T> {
  return withRetry(operation, {
    maxAttempts: 4,
    initialDelay: 1000,
    maxDelay: 16_000,
    onRetry: (error, attempt) => {
      console.warn(`${operationName} failed (attempt ${attempt}):`, error);
    },
  });
}

/**
 * Retry wrapper for network requests
 */
export async function retryNetworkRequest<T>(
  request: () => Promise<T>,
  requestName = "Network request"
): Promise<T> {
  return withRetry(request, {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    shouldRetry: (error) => {
      // Retry on network errors and 5xx status codes
      const message = parseErrorMessage(error);
      return (
        message.includes("network") ||
        message.includes("timeout") ||
        message.includes("502") ||
        message.includes("503") ||
        message.includes("504")
      );
    },
    onRetry: (error, attempt) => {
      console.warn(`${requestName} failed (attempt ${attempt}):`, error);
    },
  });
}

/**
 * Safe async wrapper that catches and handles errors
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorContext?: string,
  defaultValue?: T
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, errorContext);
    return defaultValue;
  }
}

/**
 * Validate and parse Web3 error
 */
export function parseWeb3Error(error: unknown): {
  type:
    | "user_rejected"
    | "insufficient_funds"
    | "network"
    | "contract"
    | "unknown";
  message: string;
  shouldRetry: boolean;
} {
  const message = parseErrorMessage(error);
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("user rejected") ||
    lowerMessage.includes("user denied")
  ) {
    return {
      type: "user_rejected",
      message: "Transaction rejected by user",
      shouldRetry: false,
    };
  }

  if (
    lowerMessage.includes("insufficient funds") ||
    lowerMessage.includes("insufficient balance")
  ) {
    return {
      type: "insufficient_funds",
      message: "Insufficient funds for transaction",
      shouldRetry: false,
    };
  }

  if (lowerMessage.includes("network") || lowerMessage.includes("timeout")) {
    return {
      type: "network",
      message: "Network error. Please check your connection",
      shouldRetry: true,
    };
  }

  if (
    lowerMessage.includes("execution reverted") ||
    lowerMessage.includes("revert")
  ) {
    return {
      type: "contract",
      message: "Smart contract execution failed",
      shouldRetry: false,
    };
  }

  return {
    type: "unknown",
    message,
    shouldRetry: true,
  };
}

/**
 * Error boundary helper for React components
 */
export class ErrorBoundaryError extends Error {
  constructor(
    message: string,
    public componentStack?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = "ErrorBoundaryError";
  }
}

/**
 * Log error to console with formatting
 */
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const message = parseErrorMessage(error);

  console.group(`🔴 Error ${context ? `(${context})` : ""} - ${timestamp}`);
  console.error("Message:", message);
  if (error instanceof Error) {
    console.error("Stack:", error.stack);
  }
  console.error("Raw error:", error);
  console.groupEnd();
}

/**
 * Create error with context
 */
export function createError(
  message: string,
  context?: Record<string, any>
): Error & { context?: Record<string, any> } {
  const error = new Error(message) as Error & { context?: Record<string, any> };
  if (context) {
    error.context = context;
  }
  return error;
}
