export interface CurrencyConfig {
  code: string
  symbol: string
  name: string
  monthly: number    // in smallest unit (paise/cents)
  yearly: number     // in smallest unit
  monthlyDisplay: number  // display price
  yearlyDisplay: number   // display price
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", monthly: 19900, yearly: 182400, monthlyDisplay: 199, yearlyDisplay: 1824 },
  USD: { code: "USD", symbol: "$", name: "US Dollar", monthly: 499, yearly: 4788, monthlyDisplay: 4.99, yearlyDisplay: 47.88 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", monthly: 449, yearly: 4308, monthlyDisplay: 4.49, yearlyDisplay: 43.08 },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", monthly: 399, yearly: 3828, monthlyDisplay: 3.99, yearlyDisplay: 38.28 },
  CAD: { code: "CAD", symbol: "CA$", name: "Canadian Dollar", monthly: 649, yearly: 6228, monthlyDisplay: 6.49, yearlyDisplay: 62.28 },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar", monthly: 699, yearly: 6708, monthlyDisplay: 6.99, yearlyDisplay: 67.08 },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen", monthly: 74900, yearly: 718800, monthlyDisplay: 749, yearlyDisplay: 7188 },
  BRL: { code: "BRL", symbol: "R$", name: "Brazilian Real", monthly: 2490, yearly: 23880, monthlyDisplay: 24.90, yearlyDisplay: 238.80 },
  MXN: { code: "MXN", symbol: "MX$", name: "Mexican Peso", monthly: 9900, yearly: 95040, monthlyDisplay: 99, yearlyDisplay: 950.40 },
  KRW: { code: "KRW", symbol: "₩", name: "South Korean Won", monthly: 649000, yearly: 6228000, monthlyDisplay: 6490, yearlyDisplay: 62280 },
  NGN: { code: "NGN", symbol: "₦", name: "Nigerian Naira", monthly: 77500, yearly: 744000, monthlyDisplay: 775, yearlyDisplay: 7440 },
  ZAR: { code: "ZAR", symbol: "R", name: "South African Rand", monthly: 8990, yearly: 86280, monthlyDisplay: 89.90, yearlyDisplay: 862.80 },
  SGD: { code: "SGD", symbol: "S$", name: "Singapore Dollar", monthly: 649, yearly: 6228, monthlyDisplay: 6.49, yearlyDisplay: 62.28 },
  AED: { code: "AED", symbol: "د.إ", name: "UAE Dirham", monthly: 1849, yearly: 17748, monthlyDisplay: 18.49, yearlyDisplay: 177.48 },
  SAR: { code: "SAR", symbol: "﷼", name: "Saudi Riyal", monthly: 1849, yearly: 17748, monthlyDisplay: 18.49, yearlyDisplay: 177.48 },
  MYR: { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", monthly: 2190, yearly: 21000, monthlyDisplay: 21.90, yearlyDisplay: 210 },
  PHP: { code: "PHP", symbol: "₱", name: "Philippine Peso", monthly: 27900, yearly: 267840, monthlyDisplay: 279, yearlyDisplay: 2678.40 },
  IDR: { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", monthly: 77500, yearly: 744000, monthlyDisplay: 77500, yearlyDisplay: 744000 },
  THB: { code: "THB", symbol: "฿", name: "Thai Baht", monthly: 16900, yearly: 162240, monthlyDisplay: 169, yearlyDisplay: 1622.40 },
  VND: { code: "VND", symbol: "₫", name: "Vietnamese Dong", monthly: 124900, yearly: 1199040, monthlyDisplay: 124900, yearlyDisplay: 1199040 },
  EGP: { code: "EGP", symbol: "E£", name: "Egyptian Pound", monthly: 15490, yearly: 148680, monthlyDisplay: 154.90, yearlyDisplay: 1486.80 },
  PKR: { code: "PKR", symbol: "₨", name: "Pakistani Rupee", monthly: 69900, yearly: 670800, monthlyDisplay: 699, yearlyDisplay: 6708 },
  BDT: { code: "BDT", symbol: "৳", name: "Bangladeshi Taka", monthly: 54900, yearly: 527040, monthlyDisplay: 549, yearlyDisplay: 5270.40 },
  KES: { code: "KES", symbol: "KSh", name: "Kenyan Shilling", monthly: 64900, yearly: 622800, monthlyDisplay: 649, yearlyDisplay: 6228 },
  TZS: { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling", monthly: 124900, yearly: 1199040, monthlyDisplay: 124900, yearlyDisplay: 1199040 },
  GHS: { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi", monthly: 6490, yearly: 62280, monthlyDisplay: 64.90, yearlyDisplay: 622.80 },
  PLN: { code: "PLN", symbol: "zł", name: "Polish Zloty", monthly: 1990, yearly: 19080, monthlyDisplay: 19.90, yearlyDisplay: 190.80 },
  TRY: { code: "TRY", symbol: "₺", name: "Turkish Lira", monthly: 16490, yearly: 158280, monthlyDisplay: 164.90, yearlyDisplay: 1582.80 },
  RUB: { code: "RUB", symbol: "₽", name: "Russian Ruble", monthly: 44900, yearly: 430800, monthlyDisplay: 449, yearlyDisplay: 4308 },
  DKK: { code: "DKK", symbol: "kr", name: "Danish Krone", monthly: 3290, yearly: 31560, monthlyDisplay: 32.90, yearlyDisplay: 315.60 },
  SEK: { code: "SEK", symbol: "kr", name: "Swedish Krona", monthly: 4990, yearly: 47880, monthlyDisplay: 49.90, yearlyDisplay: 478.80 },
  NOK: { code: "NOK", symbol: "kr", name: "Norwegian Krone", monthly: 5290, yearly: 50760, monthlyDisplay: 52.90, yearlyDisplay: 507.60 },
  CHF: { code: "CHF", symbol: "CHF", name: "Swiss Franc", monthly: 499, yearly: 4788, monthlyDisplay: 4.99, yearlyDisplay: 47.88 },
  NZD: { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", monthly: 749, yearly: 7188, monthlyDisplay: 7.49, yearlyDisplay: 71.88 },
  HKD: { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", monthly: 3890, yearly: 37320, monthlyDisplay: 38.90, yearlyDisplay: 373.20 },
  TWD: { code: "TWD", symbol: "NT$", name: "Taiwan Dollar", monthly: 15900, yearly: 152640, monthlyDisplay: 159, yearlyDisplay: 1526.40 },
  COP: { code: "COP", symbol: "COL$", name: "Colombian Peso", monthly: 199000, yearly: 1908000, monthlyDisplay: 1990, yearlyDisplay: 19080 },
  PEN: { code: "PEN", symbol: "S/", name: "Peruvian Sol", monthly: 1890, yearly: 18120, monthlyDisplay: 18.90, yearlyDisplay: 181.20 },
  ARS: { code: "ARS", symbol: "AR$", name: "Argentine Peso", monthly: 499000, yearly: 4788000, monthlyDisplay: 4990, yearlyDisplay: 47880 },
  CLP: { code: "CLP", symbol: "CL$", name: "Chilean Peso", monthly: 499000, yearly: 4788000, monthlyDisplay: 4990, yearlyDisplay: 47880 },
  CNY: { code: "CNY", symbol: "¥", name: "Chinese Yuan", monthly: 3490, yearly: 33480, monthlyDisplay: 34.90, yearlyDisplay: 334.80 },
}

export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // South Asia
  IN: "INR", PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR", MV: "MVR",
  // North America
  US: "USD", CA: "CAD", MX: "MXN",
  // Europe
  GB: "GBP", DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR",
  BE: "EUR", AT: "EUR", PT: "EUR", IE: "EUR", FI: "EUR", GR: "EUR",
  PL: "PLN", CZ: "CZK", RO: "RON", HU: "HUF", BG: "BGN", HR: "HRK",
  DK: "DKK", SE: "SEK", NO: "NOK", CH: "CHF", RU: "RUB", UA: "UAH",
  // Asia Pacific
  JP: "JPY", KR: "KRW", CN: "CNY", TW: "TWD", HK: "HKD", SG: "SGD",
  MY: "MYR", TH: "THB", VN: "VND", ID: "IDR", PH: "PHP", AU: "AUD",
  NZ: "NZD",
  // Middle East
  AE: "AED", SA: "SAR", QA: "QAR", KW: "KWD", BH: "BHD", OM: "OMR",
  IL: "ILS", TR: "TRY",
  // Africa
  NG: "NGN", KE: "KES", GH: "GHS", TZ: "TZS", ZA: "ZAR", EG: "EGP",
  // Latin America
  BR: "BRL", AR: "ARS", CL: "CLP", CO: "COP", PE: "PEN",
}

export function getCurrencyForCountry(countryCode: string): CurrencyConfig {
  const code = COUNTRY_TO_CURRENCY[countryCode] || "USD"
  return CURRENCIES[code] || CURRENCIES.USD
}

export function formatPrice(amount: number, symbol: string): string {
  if (amount >= 1000) {
    return `${symbol}${amount.toLocaleString()}`
  }
  return `${symbol}${amount}`
}
