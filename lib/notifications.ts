/**
 * Enhanced notification utilities
 * Provides convenient methods for showing toasts for common scenarios
 */

import { toast } from '@/components/toast';
import { toast as sonnerToast } from 'sonner';

/**
 * Show success notification
 */
export function notifySuccess(message: string) {
  return toast({
    type: 'success',
    description: message,
  });
}

/**
 * Show error notification
 */
export function notifyError(message: string) {
  return toast({
    type: 'error',
    description: message,
  });
}

/**
 * Show wallet connection success
 */
export function notifyWalletConnected(address: string) {
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return notifySuccess(`Wallet connected: ${shortAddress}`);
}

/**
 * Show wallet disconnection
 */
export function notifyWalletDisconnected() {
  return sonnerToast.info('Wallet disconnected');
}

/**
 * Show network switch notification
 */
export function notifyNetworkSwitched(networkName: string) {
  return notifySuccess(`Switched to ${networkName}`);
}

/**
 * Show transaction submitted notification
 */
export function notifyTransactionSubmitted(txHash: string) {
  const shortHash = `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;
  return sonnerToast.loading(`Transaction submitted: ${shortHash}`, {
    duration: Infinity,
    id: txHash,
  });
}

/**
 * Show transaction confirmed notification
 */
export function notifyTransactionConfirmed(txHash: string) {
  sonnerToast.dismiss(txHash);
  const shortHash = `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;
  return notifySuccess(`Transaction confirmed: ${shortHash}`);
}

/**
 * Show transaction failed notification
 */
export function notifyTransactionFailed(error: string) {
  return notifyError(`Transaction failed: ${error}`);
}

/**
 * Show payment successful notification
 */
export function notifyPaymentSuccess(amount: string, plan: string) {
  return notifySuccess(`Payment of ${amount} successful! Subscribed to ${plan} plan.`);
}

/**
 * Show payment failed notification
 */
export function notifyPaymentFailed(reason: string) {
  return notifyError(`Payment failed: ${reason}`);
}

/**
 * Show file uploaded to DSN notification
 */
export function notifyFileUploaded(cid: string) {
  const shortCID = `${cid.slice(0, 12)}...${cid.slice(-8)}`;
  return notifySuccess(`File uploaded to DSN: ${shortCID}`);
}

/**
 * Show file download started
 */
export function notifyFileDownloading(cid: string) {
  const shortCID = `${cid.slice(0, 12)}...${cid.slice(-8)}`;
  return sonnerToast.loading(`Downloading from DSN: ${shortCID}`, {
    id: `download-${cid}`,
  });
}

/**
 * Show file downloaded
 */
export function notifyFileDownloaded(cid: string) {
  sonnerToast.dismiss(`download-${cid}`);
  return notifySuccess('File downloaded successfully');
}

/**
 * Show copy to clipboard notification
 */
export function notifyCopied(label: string = 'Text') {
  return notifySuccess(`${label} copied to clipboard`);
}

/**
 * Show insufficient balance notification
 */
export function notifyInsufficientBalance(required: string, current: string) {
  return notifyError(`Insufficient balance. Required: ${required}, Current: ${current}`);
}

/**
 * Show DSN connection status
 */
export function notifyDSNConnected() {
  return notifySuccess('Connected to Autonomys DSN');
}

export function notifyDSNDisconnected() {
  return sonnerToast.warning('Disconnected from Autonomys DSN');
}

/**
 * Show API key missing notification
 */
export function notifyAPIKeyMissing() {
  return sonnerToast.warning('AutoDrive API key not configured. Add NEXT_PUBLIC_AUTONOMYS_API_KEY to enable DSN storage.');
}

/**
 * Show chat saved notification
 */
export function notifyChatSaved(location: 'local' | 'dsn') {
  if (location === 'dsn') {
    return notifySuccess('Chat saved to Autonomys DSN');
  }
  return sonnerToast.info('Chat saved locally');
}

/**
 * Show chat loaded notification
 */
export function notifyChatLoaded(source: 'local' | 'dsn') {
  if (source === 'dsn') {
    return sonnerToast.info('Chat loaded from Autonomys DSN');
  }
  return sonnerToast.info('Chat loaded from local storage');
}

/**
 * Show export started
 */
export function notifyExportStarted(format: string) {
  return sonnerToast.loading(`Exporting chat to ${format.toUpperCase()}...`, {
    id: 'export',
  });
}

/**
 * Show export completed
 */
export function notifyExportCompleted() {
  sonnerToast.dismiss('export');
  return notifySuccess('Export completed successfully');
}

/**
 * Show export failed
 */
export function notifyExportFailed(error: string) {
  sonnerToast.dismiss('export');
  return notifyError(`Export failed: ${error}`);
}

/**
 * Show subscription updated
 */
export function notifySubscriptionUpdated(plan: string) {
  return notifySuccess(`Subscription updated to ${plan} plan`);
}

/**
 * Show subscription expired
 */
export function notifySubscriptionExpired() {
  return sonnerToast.warning('Your subscription has expired. Please renew to continue using premium features.');
}

/**
 * Show subscription expiring soon
 */
export function notifySubscriptionExpiringSoon(daysLeft: number) {
  return sonnerToast.warning(`Your subscription expires in ${daysLeft} days. Renew now to avoid interruption.`);
}

/**
 * Generic loading notification
 */
export function notifyLoading(message: string, id?: string) {
  return sonnerToast.loading(message, { id });
}

/**
 * Dismiss notification
 */
export function dismissNotification(id?: string | number) {
  sonnerToast.dismiss(id);
}

/**
 * Show custom notification
 */
export function notify(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
  switch (type) {
    case 'success':
      return notifySuccess(message);
    case 'error':
      return notifyError(message);
    case 'info':
      return sonnerToast.info(message);
    case 'warning':
      return sonnerToast.warning(message);
  }
}
