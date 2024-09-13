import {
  type Join,
  type PathsToStringProps,
  type WithOptional,
} from "../types/helper.types";
import {
  type CheckboxPropertyFilter,
  type CheckboxPropertyItemObjectResponse,
  type DatabaseObjectResponse,
  type DatePropertyFilter,
  type DatePropertyItemObjectResponse,
  type ExistencePropertyFilter,
  type MultiSelectPropertyItemObjectResponse,
  type NumberPropertyFilter,
  type NumberPropertyItemObjectResponse,
  type QueryDatabaseBodyParameters,
  type RichTextPropertyItemObjectResponse,
  type SelectPropertyItemObjectResponse,
  type StringRequest,
  type TextPropertyFilter,
  type TimestampCreatedTimeFilter,
  type TimestampLastEditedTimeFilter,
  type TitlePropertyItemObjectResponse,
  type UrlPropertyItemObjectResponse,
} from "../types/notion-api.types";
import { type FINANCE_DATABASE_PROPS_TO_IDS } from "./constants";

export interface FinanceDatabaseResponse
  extends WithOptional<
    Omit<DatabaseObjectResponse, "properties">,
    "title" | "description" | "is_inline" | "url" | "public_url"
  > {
  properties: {
    Account: Omit<SelectPropertyItemObjectResponse, "select"> & {
      select:
        | { id: StringRequest; name: "sparkasse"; color: "red" }
        | { id: StringRequest; name: "paypal"; color: "green" }
        | { id: StringRequest; name: "commerzbank"; color: "blue" };
    };
    "Check Box": CheckboxPropertyItemObjectResponse;
    Amount: NumberPropertyItemObjectResponse;
    Receipt: UrlPropertyItemObjectResponse;
    Category: Omit<MultiSelectPropertyItemObjectResponse, "multi_select"> & {
      multi_select: [
        | { id: StringRequest; name: "Persembahan"; color: "red" }
        | { id: StringRequest; name: "Makan"; color: "pink" }
        | { id: StringRequest; name: "Pendeta"; color: "orange" }
        | { id: StringRequest; name: "Other"; color: "yellow" }
        | { id: StringRequest; name: "Perpuluhan"; color: "pink" }
        | { id: StringRequest; name: "Acara Natal"; color: "green" }
        | { id: StringRequest; name: "Grillen"; color: "brown" },
      ];
    };
    Date: DatePropertyItemObjectResponse;
    "income/expense": Omit<SelectPropertyItemObjectResponse, "select"> & {
      select:
        | { id: StringRequest; name: "expense"; color: "brown" }
        | { id: StringRequest; name: "income"; color: "purple" };
    };
    Notes: RichTextPropertyItemObjectResponse;
    Description: TitlePropertyItemObjectResponse;
    uses: Omit<SelectPropertyItemObjectResponse, "select"> & {
      select:
        | { id: StringRequest; name: "internal"; color: "orange" }
        | { id: StringRequest; name: "eksternal"; color: "pink" }
        | { id: StringRequest; name: "pendeta"; color: "green" }
        | { id: StringRequest; name: "gereja"; color: "brown" }
        | { id: StringRequest; name: "others"; color: "blue" };
    };
  };
}

export type FinanceDatabaseResponseProperties =
  keyof FinanceDatabaseResponse["properties"];
export type FinanceDatabasePath = Join<
  PathsToStringProps<FinanceDatabaseResponse>
>;

export type FinanceDatabaseAccountPropertyType =
  FinanceDatabaseResponse["properties"]["Account"]["select"]["name"];

type FinanceDatabaseAccountPropertyFilter =
  | {
      equals: FinanceDatabaseAccountPropertyType;
    }
  | {
      does_not_equal: FinanceDatabaseAccountPropertyType;
    }
  | ExistencePropertyFilter;

type FinanceDatabaseCheckBoxPropertyFilter = CheckboxPropertyFilter;
type FinanceDatabaseAmountPropertyFilter = NumberPropertyFilter;
type FinanceDatabaseReceiptPropertyFilter = TextPropertyFilter;

export type FinanceDatabaseCategoryPropertyType =
  FinanceDatabaseResponse["properties"]["Category"]["multi_select"][number]["name"];

type FinanceDatabaseCategoryPropertyFilter =
  | {
      contains: FinanceDatabaseCategoryPropertyType;
    }
  | {
      does_not_contain: FinanceDatabaseCategoryPropertyType;
    }
  | ExistencePropertyFilter;

type FinanceDatabaseDatePropertyFilter = DatePropertyFilter;

export type FinanceDatabaseIncomeexpensePropertyType =
  FinanceDatabaseResponse["properties"]["income/expense"]["select"]["name"];

type FinanceDatabaseIncomeexpensePropertyFilter =
  | {
      equals: FinanceDatabaseIncomeexpensePropertyType;
    }
  | {
      does_not_equal: FinanceDatabaseIncomeexpensePropertyType;
    }
  | ExistencePropertyFilter;

type FinanceDatabaseNotesPropertyFilter = TextPropertyFilter;
type FinanceDatabaseDescriptionPropertyFilter = TextPropertyFilter;

export type FinanceDatabaseUsesPropertyType =
  FinanceDatabaseResponse["properties"]["uses"]["select"]["name"];

type FinanceDatabaseUsesPropertyFilter =
  | {
      equals: FinanceDatabaseUsesPropertyType;
    }
  | {
      does_not_equal: FinanceDatabaseUsesPropertyType;
    }
  | ExistencePropertyFilter;

export type FinanceDatabasePropertyFilter =
  | { account: FinanceDatabaseAccountPropertyFilter }
  | { checkBox: FinanceDatabaseCheckBoxPropertyFilter }
  | { amount: FinanceDatabaseAmountPropertyFilter }
  | { receipt: FinanceDatabaseReceiptPropertyFilter }
  | { category: FinanceDatabaseCategoryPropertyFilter }
  | { date: FinanceDatabaseDatePropertyFilter }
  | { incomeexpense: FinanceDatabaseIncomeexpensePropertyFilter }
  | { notes: FinanceDatabaseNotesPropertyFilter }
  | { description: FinanceDatabaseDescriptionPropertyFilter }
  | { uses: FinanceDatabaseUsesPropertyFilter };

export type FinanceDatabaseQuery = Omit<
  QueryDatabaseBodyParameters,
  "filter" | "sorts"
> & {
  sorts?: Array<
    | {
        property: keyof typeof FINANCE_DATABASE_PROPS_TO_IDS;
        direction: "ascending" | "descending";
      }
    | {
        timestamp: "created_time" | "last_edited_time";
        direction: "ascending" | "descending";
      }
  >;
  filter?:
    | {
        or: Array<
          | FinanceDatabasePropertyFilter
          | TimestampCreatedTimeFilter
          | TimestampLastEditedTimeFilter
          | {
              // or: FinanceDatabaseQuery['filter']
              or: Array<FinanceDatabasePropertyFilter>;
            }
          | {
              // and: FinanceDatabaseQuery['filter']
              and: Array<FinanceDatabasePropertyFilter>;
            }
        >;
      }
    | {
        and: Array<
          | FinanceDatabasePropertyFilter
          | TimestampCreatedTimeFilter
          | TimestampLastEditedTimeFilter
          | {
              // or: FinanceDatabaseQuery['filter']
              or: Array<FinanceDatabasePropertyFilter>;
            }
          | {
              // and: FinanceDatabaseQuery['filter']
              and: Array<FinanceDatabasePropertyFilter>;
            }
        >;
      }
    | FinanceDatabasePropertyFilter
    | TimestampCreatedTimeFilter
    | TimestampLastEditedTimeFilter;
};

export type FinanceDatabaseQueryFilter = FinanceDatabaseQuery["filter"];

export type FinanceDatabaseQueryResponse = {
  results: FinanceDatabaseResponse[];
  next_cursor: string | null;
  has_more: boolean;
};
