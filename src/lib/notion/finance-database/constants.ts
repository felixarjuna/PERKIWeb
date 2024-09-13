export const FINANCE_DATABASE_PROP_VALUES = {
  account: ["sparkasse", "paypal", "commerzbank"] as const,
  category: [
    "Persembahan",
    "Makan",
    "Pendeta",
    "Other",
    "Perpuluhan",
    "Acara Natal",
    "Grillen",
  ] as const,
  incomeexpense: ["expense", "income"] as const,
  uses: ["internal", "eksternal", "pendeta", "gereja", "others"] as const,
};

export const FINANCE_DATABASE_PROPS_TO_IDS = {
  account: "A%5B%5EX",
  checkBox: "LHFX",
  amount: "UMnH",
  receipt: "VTP%3B",
  category: "%60%3Ev%5E",
  date: "fE%5Dg",
  incomeexpense: "k%3CsD",
  notes: "pSzF",
  description: "title",
  uses: "6dd9bbe4-5367-4799-a158-a81f04340de5",
} as const;
export const FINANCE_DATABASE_IDS_TO_PROPS = {
  "A%5B%5EX": "account",
  LHFX: "checkBox",
  UMnH: "amount",
  "VTP%3B": "receipt",
  "%60%3Ev%5E": "category",
  "fE%5Dg": "date",
  "k%3CsD": "incomeexpense",
  pSzF: "notes",
  title: "description",
  "6dd9bbe4-5367-4799-a158-a81f04340de5": "uses",
} as const;
export const FINANCE_DATABASE_PROPS_TO_TYPES = {
  account: "select",
  checkBox: "checkbox",
  amount: "number",
  receipt: "url",
  category: "multi_select",
  date: "date",
  incomeexpense: "select",
  notes: "rich_text",
  description: "title",
  uses: "select",
} as const;

export type FinanceDatabaseDTOProperties =
  keyof typeof FINANCE_DATABASE_PROPS_TO_IDS;
