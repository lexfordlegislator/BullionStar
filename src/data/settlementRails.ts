export type SettlementRailId =
  | 'SWIFT / International Wire'
  | 'SEPA (Eurozone)'
  | 'ACH / Fedwire (USA)'
  | 'Singapore FAST / PayNow'
  | 'Crypto / Stablecoin Settlement';

export type BuyPaymentMethod = 'Available Cash Balance' | SettlementRailId;

export interface RailFieldDef {
  key: string;
  label: string;
  type?: 'text' | 'select';
  placeholder?: string;
  options?: string[];
  required: boolean;
  exactDigits?: number;
}

export const SETTLEMENT_RAILS: SettlementRailId[] = [
  'SWIFT / International Wire',
  'SEPA (Eurozone)',
  'ACH / Fedwire (USA)',
  'Singapore FAST / PayNow',
  'Crypto / Stablecoin Settlement',
];

export const BUY_PAYMENT_METHODS: BuyPaymentMethod[] = [
  'Available Cash Balance',
  ...SETTLEMENT_RAILS,
];

export const WITHDRAWAL_RAIL_FIELDS: Record<SettlementRailId, RailFieldDef[]> = {
  'SWIFT / International Wire': [
    {
      key: 'Beneficiary Full Name',
      label: 'Beneficiary Full Name',
      placeholder: 'Full legal name matching bank account',
      required: true,
    },
    {
      key: 'Bank Name',
      label: 'Bank Name',
      placeholder: 'e.g. HSBC / UBS / Standard Chartered',
      required: true,
    },
    {
      key: 'Bank Country',
      label: 'Bank Country',
      placeholder: 'e.g. Singapore / United Kingdom / Switzerland',
      required: true,
    },
    {
      key: 'IBAN / Account Number',
      label: 'IBAN / Account Number',
      placeholder: 'e.g. GB29 NWBK 6016 1331 9268 19 or 001-234567-89',
      required: true,
    },
    {
      key: 'SWIFT/BIC Code',
      label: 'SWIFT / BIC Code',
      placeholder: 'e.g. HSBCSGSGXXX',
      required: true,
    },
    {
      key: 'Bank Address',
      label: 'Bank Branch Address',
      placeholder: 'Street address, city, postal code',
      required: true,
    },
  ],
  'SEPA (Eurozone)': [
    {
      key: 'Account Holder Name',
      label: 'Account Holder Name',
      placeholder: 'Full name on Eurozone bank account',
      required: true,
    },
    {
      key: 'IBAN',
      label: 'IBAN',
      placeholder: 'e.g. DE89 3704 0044 0532 0130 00',
      required: true,
    },
    {
      key: 'BIC/SWIFT',
      label: 'BIC / SWIFT',
      placeholder: 'e.g. COBADEFFXXX',
      required: true,
    },
  ],
  'ACH / Fedwire (USA)': [
    {
      key: 'Account Holder Name',
      label: 'Account Holder Name',
      placeholder: 'Full name on US bank account',
      required: true,
    },
    {
      key: 'Bank Name',
      label: 'Bank Name',
      placeholder: 'e.g. JPMorgan Chase / Bank of America',
      required: true,
    },
    {
      key: '9-Digit Routing Number',
      label: '9-Digit Routing Number (ABA)',
      placeholder: 'e.g. 021000021',
      required: true,
      exactDigits: 9,
    },
    {
      key: 'Account Number',
      label: 'Account Number',
      placeholder: 'US bank account number',
      required: true,
    },
    {
      key: 'Account Type',
      label: 'Account Type',
      type: 'select',
      options: ['Checking', 'Savings'],
      required: true,
    },
  ],
  'Singapore FAST / PayNow': [
    {
      key: 'Account Holder Name',
      label: 'Account Holder Name',
      placeholder: 'Full name on Singapore account',
      required: true,
    },
    {
      key: 'Bank Name',
      label: 'Bank Name',
      type: 'select',
      options: ['DBS / POSB', 'OCBC Bank', 'UOB Bank', 'Maybank Singapore', 'Standard Chartered SG', 'HSBC Singapore'],
      required: true,
    },
    {
      key: 'Account Number or PayNow UEN/Mobile',
      label: 'Account Number or PayNow UEN / Mobile',
      placeholder: 'e.g. 072-123456-0 or +65 9123 4567',
      required: true,
    },
  ],
  'Crypto / Stablecoin Settlement': [
    {
      key: 'Network',
      label: 'Blockchain Network & Token',
      type: 'select',
      options: ['ERC-20 (USDT / USDC)', 'TRC-20 (USDT)', 'Bitcoin (BTC)'],
      required: true,
    },
    {
      key: 'Destination Wallet Address',
      label: 'Destination Wallet Address',
      placeholder: '0x... / T... / bc1...',
      required: true,
    },
  ],
};

export const DEPOSIT_ORIGINATING_FIELDS: Record<SettlementRailId, RailFieldDef[]> = {
  'SWIFT / International Wire': [
    {
      key: 'Sender Full Name',
      label: 'Sender Full Name',
      placeholder: 'Legal name on sending bank account',
      required: true,
    },
    {
      key: 'Originating Bank / Institution Name',
      label: 'Originating Bank / Institution Name',
      placeholder: 'e.g. UBS Switzerland AG / Citibank',
      required: true,
    },
    {
      key: 'Originating Account Number / IBAN',
      label: 'Originating Account Number / IBAN',
      placeholder: 'Sending IBAN or bank account number',
      required: true,
    },
    {
      key: 'Transfer Reference ID',
      label: 'Transfer Reference ID / Wire Reference',
      placeholder: 'e.g. WIRE-2026-88412',
      required: true,
    },
  ],
  'SEPA (Eurozone)': [
    {
      key: 'Sender Full Name',
      label: 'Sender Full Name',
      placeholder: 'Legal name on Eurozone account',
      required: true,
    },
    {
      key: 'Originating Bank / Institution Name',
      label: 'Originating Bank / Institution Name',
      placeholder: 'e.g. Deutsche Bank / BNP Paribas',
      required: true,
    },
    {
      key: 'Originating IBAN',
      label: 'Originating IBAN',
      placeholder: 'e.g. DE89 3704 0044 0532 0130 00',
      required: true,
    },
    {
      key: 'Transfer Reference ID',
      label: 'SEPA End-to-End Reference ID',
      placeholder: 'e.g. SEPA-2026-4410',
      required: true,
    },
  ],
  'ACH / Fedwire (USA)': [
    {
      key: 'Sender Full Name',
      label: 'Sender Full Name',
      placeholder: 'Account holder name on US bank',
      required: true,
    },
    {
      key: 'Originating Bank / Institution Name',
      label: 'Originating US Bank Name',
      placeholder: 'e.g. JPMorgan Chase / Wells Fargo',
      required: true,
    },
    {
      key: 'Originating Account Number',
      label: 'Originating Account Number (last 4+ or full)',
      placeholder: 'e.g. 9840123456',
      required: true,
    },
    {
      key: 'Transfer Reference ID',
      label: 'Fedwire IMAD / ACH Trace Number',
      placeholder: 'e.g. FED-20261119-0091',
      required: true,
    },
  ],
  'Singapore FAST / PayNow': [
    {
      key: 'Sender Full Name',
      label: 'Sender Full Name',
      placeholder: 'Name on Singapore bank / PayNow',
      required: true,
    },
    {
      key: 'Originating Bank / Institution Name',
      label: 'Originating Singapore Bank',
      placeholder: 'e.g. DBS / OCBC / UOB',
      required: true,
    },
    {
      key: 'Originating Account / PayNow Mobile',
      label: 'Originating Account Number or PayNow Mobile',
      placeholder: 'e.g. 072-918273-1 or +65 9123 4567',
      required: true,
    },
    {
      key: 'Transfer Reference ID',
      label: 'FAST / PayNow Transaction Reference',
      placeholder: 'e.g. FAST-8829104',
      required: true,
    },
  ],
  'Crypto / Stablecoin Settlement': [
    {
      key: 'Sender Full Name',
      label: 'Sender Full Name',
      placeholder: 'Account holder name',
      required: true,
    },
    {
      key: 'Originating Exchange / Wallet Provider',
      label: 'Originating Exchange / Wallet Custody',
      placeholder: 'e.g. Coinbase Custody / Ledger / Fireblocks',
      required: true,
    },
    {
      key: 'Network',
      label: 'Network & Asset',
      type: 'select',
      options: ['ERC-20 (USDT / USDC)', 'TRC-20 (USDT)', 'Bitcoin (BTC)'],
      required: true,
    },
    {
      key: 'Originating Wallet Address',
      label: 'Originating Wallet Address',
      placeholder: '0x... / T... / bc1...',
      required: true,
    },
    {
      key: 'Transfer Reference ID',
      label: 'Blockchain TXID / Transfer Reference',
      placeholder: 'Transaction hash or pending batch ref',
      required: true,
    },
  ],
};

export interface TreasuryInstruction {
  headline: string;
  rows: { label: string; value: string }[];
  note: string;
}

export const getTreasuryInstructions = (
  rail: SettlementRailId,
  vaultId?: string
): TreasuryInstruction => {
  const refTag = vaultId ? `Vault ID ${vaultId}` : 'Your BullionStar Vault ID';
  switch (rail) {
    case 'SWIFT / International Wire':
      return {
        headline: 'BullionStar Official Receiving Wire Treasury (SWIFT)',
        rows: [
          { label: 'Beneficiary Name', value: 'BullionStar Pte. Ltd. — Client Segregated Treasury' },
          { label: 'Beneficiary Bank', value: 'DBS Bank Ltd, 12 Marina Boulevard, Singapore 018982' },
          { label: 'USD Account Number', value: '0003-884129-01-4' },
          { label: 'SWIFT / BIC Code', value: 'DBSSSGSGXXX' },
          { label: 'Mandatory Payment Memo', value: `${refTag} + Your Transfer Reference ID` },
        ],
        note: 'Funds clear into segregated custody upon treasury reconciliation (1–2 business days).',
      };
    case 'SEPA (Eurozone)':
      return {
        headline: 'BullionStar Official Eurozone Treasury (SEPA / EUR)',
        rows: [
          { label: 'Beneficiary Name', value: 'BullionStar International Treasury Ltd.' },
          { label: 'Receiving Bank', value: 'Banking Circle S.A. (Luxembourg)' },
          { label: 'Treasury IBAN', value: 'LU89 4080 0000 2641 8890' },
          { label: 'BIC / SWIFT', value: 'BCIRLULLXXX' },
          { label: 'Mandatory Payment Memo', value: `${refTag} + SEPA Reference` },
        ],
        note: 'Supports SEPA Instant and standard SEPA credit transfers in EUR.',
      };
    case 'ACH / Fedwire (USA)':
      return {
        headline: 'BullionStar US Domestic Custody Treasury (ACH / Fedwire)',
        rows: [
          { label: 'Beneficiary Name', value: 'BullionStar US Custody Clearing LLC' },
          { label: 'Receiving Bank', value: 'Citibank N.A., 388 Greenwich St, New York, NY 10013' },
          { label: 'ABA Routing Number', value: '021000089' },
          { label: 'Treasury Account No.', value: '3148920451 (Corporate Checking)' },
          { label: 'Mandatory Payment Memo', value: `${refTag} + Fedwire/ACH Trace` },
        ],
        note: 'Same-day settlement available for Fedwire transfers received prior to 16:00 EST.',
      };
    case 'Singapore FAST / PayNow':
      return {
        headline: 'BullionStar Singapore Domestic Treasury (FAST / PayNow)',
        rows: [
          { label: 'Beneficiary Name', value: 'BullionStar Pte. Ltd.' },
          { label: 'Receiving Bank', value: 'DBS Bank Singapore (FAST Instant)' },
          { label: 'SGD Account Number', value: '072-941028-5' },
          { label: 'Corporate PayNow UEN', value: '201217896WTREAS' },
          { label: 'Mandatory Payment Memo', value: `${refTag}` },
        ],
        note: 'FAST transfers from Singapore bank accounts are verified within minutes during treasury review.',
      };
    case 'Crypto / Stablecoin Settlement':
      return {
        headline: 'BullionStar Institutional Digital Custody Addresses',
        rows: [
          { label: 'USDT / USDC (ERC-20)', value: '0x742d35Cc6634C0532925a3b844Bc454e4438f91A' },
          { label: 'USDT (TRC-20)', value: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE' },
          { label: 'Bitcoin (BTC Native SegWit)', value: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
          { label: 'Mandatory Memo / Ref', value: `Submit TXID & ${refTag}` },
        ],
        note: 'Send strictly from your declared originating wallet address on the matching network.',
      };
  }
};

export const VAULT_FACILITY_REGIONS = [
  'Singapore Main Vault (45 New Bridge Road)',
  'Zurich FreePort',
  'London LBMA Vault',
  'New York Depository',
  'Dubai DMCC Vault',
] as const;

export const PHYSICAL_DEPOSIT_ASSET_TYPES = [
  'Gold Bullion Bars (LBMA / Cast / Minted)',
  'Gold Sovereign & Bullion Coins',
  'Silver Bullion Bars / Coins',
  'Platinum / Palladium Bars',
  'GIA-Certified Investment Diamonds',
  'Mixed Precious Metals Parcel',
] as const;

export const getDefaultFieldValues = (fields: RailFieldDef[]): Record<string, string> => {
  const out: Record<string, string> = {};
  fields.forEach((f) => {
    out[f.key] = f.type === 'select' && f.options && f.options.length > 0 ? f.options[0] : '';
  });
  return out;
};

export const validateRailFields = (
  fields: RailFieldDef[],
  values: Record<string, string>
): { valid: boolean; error?: string } => {
  for (const field of fields) {
    const val = (values[field.key] || '').trim();
    if (field.required && !val) {
      return { valid: false, error: `Please enter ${field.label}.` };
    }
    if (field.exactDigits) {
      const digits = val.replace(/\D/g, '');
      if (digits.length !== field.exactDigits) {
        return {
          valid: false,
          error: `${field.label} must contain exactly ${field.exactDigits} digits.`,
        };
      }
    }
  }
  return { valid: true };
};
