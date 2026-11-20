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
}: SendTransactionNotificationEmailParams): Promise<{ ok: boolean; error?: string }> => {
  const cleanTo = (to || '').trim();
  if (!cleanTo) {
    return { ok: false, error: 'Missing recipient email address.' };
  }

  try {
    const { error } = await supabase.functions.invoke('send-transaction-email', {
      body: {
        to: cleanTo,
        clientName: (clientName || '').trim() || cleanTo,
        txType,
        assetSummary,
        amountText,
        status,
        referenceId,
        isStatusUpdate,
      },
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unable to send transaction notification email.',
    };
  }
};
