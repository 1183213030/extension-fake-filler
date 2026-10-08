declare module '*/chinese-id-card.js' {
  export const DISTRICT_CODES: string[];
  export function calculateCheckCode(base17: string): string;
  export function generateIdCard(): string;
}

declare module '*/usci.js' {
  export function calculateUsciCheckCode(base17: string): string;
  export function generateUsci(): string;
}

declare module '*/luhn.js' {
  export function calculateLuhnCheckDigit(base: string): number;
  export function generateBankCard(bin?: string, length?: number): string;
}
