import { supabase } from './supabase';

export interface SendTransactionNotificationEmailParams {
  to: string;
  clientName: string;
  txType: string;
  assetSummary: string;
  amountText: string;
  status: string;
  referenceId: string;
  isStatusUpdate: boolean;
}

export const formatTransactionEmailAmountText = (params: {
  amountUsd?: number;
  currency?: string;
  assetSummary?: string;
  accountDetails?: Record<string, string> | null;
}): string => {
  const { amountUsd = 0, assetSummary, accountDetails } = params;
  const declared = accountDetails?.['Declared Amount'];
  if (declared && declared.trim()) {
    return declared.trim();
  }
  const usdFormatted =
    amountUsd > 0
      ? `US$${amountUsd.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : '';
  const qty = accountDetails?.release_quantity || accountDetails?.['Estimated Weight / Quantity'];
  const metal = accountDetails?.metal_type || accountDetails?.['Metal / Asset Type'];

  if (qty && metal) {
    return usdFormatted ? `${qty} ${metal} (${usdFormatted})` : `${qty} ${metal}`;
  }
  if (usdFormatted && assetSummary) {
    return `${usdFormatted} · ${assetSummary}`;
  }
  if (usdFormatted) {
    return usdFormatted;
  }
  return assetSummary || 'Vault Allocation Request';
};

export const sendTransactionNotificationEmail = async ({
  to,
  clientName,
  txType,
  assetSummary,
  amountText,
  status,
  referenceId,
  isStatusUpdate,
}: SendTransactionNotificationEmailParams): Promise<{ ok: boolean; data?: unknown; error?: string }> => {
  const cleanTo = (to || '').trim();
  if (!cleanTo) {
    console.log('[send-transaction-email] Skipped: missing recipient email address.', {
      txType,
      status,
      referenceId,
      isStatusUpdate,
    });
    return { ok: false, error: 'Missing recipient email address.' };
  }

  const payload = {
    to: cleanTo,
    clientName: (clientName || '').trim() || cleanTo,
    txType,
    assetSummary,
    amountText,
    status,
    referenceId,
    isStatusUpdate,
  };

  try {
    console.log('[send-transaction-email] Invoking Edge Function with payload:', payload);
    const { data, error } = await supabase.functions.invoke('send-transaction-email', {
      body: payload,
    });

    if (error) {
      console.log('[send-transaction-email] Edge Function returned error:', error);
      return { ok: false, error: error.message };
    }

    console.log('[send-transaction-email] Edge Function response:', data);
    return { ok: true, data };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unable to send transaction notification email.';
    console.log('[send-transaction-email] Invocation exception:', message, err);
    return {
      ok: false,
      error: message,
    };
  }
};
