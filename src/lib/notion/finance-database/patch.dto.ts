import {
  type RichTextItemRequest,
  type UpdatePageBodyParameters,
} from "../types/notion-api.types";
import { type FinanceDatabaseResponse } from "./types";

type TypeFromRecord<Obj, Type> = Obj extends Record<string, infer T>
  ? Extract<T, Type>
  : never;

export type FinanceDatabasePropertiesPatch = {
  account?: FinanceDatabaseResponse["properties"]["Account"]["select"]["name"];
  checkBox?: TypeFromRecord<
    UpdatePageBodyParameters["properties"],
    { type: "checkbox" }
  >["checkbox"];
  amount?: TypeFromRecord<
    UpdatePageBodyParameters["properties"],
    { type: "number" }
  >["number"];
  receipt?: TypeFromRecord<
    UpdatePageBodyParameters["properties"],
    { type: "url" }
  >["url"];
  category?: FinanceDatabaseResponse["properties"]["Category"]["multi_select"][number]["name"][];
  date?: TypeFromRecord<
    UpdatePageBodyParameters["properties"],
    { type: "date" }
  >["date"];
  incomeexpense?: FinanceDatabaseResponse["properties"]["income/expense"]["select"]["name"];
  notes?:
    | string
    | {
        text: string;
        url?: string;
        annotations?: RichTextItemRequest["annotations"];
      }
    | RichTextItemRequest[];
  description?:
    | string
    | {
        text: string;
        url?: string;
        annotations?: RichTextItemRequest["annotations"];
      }
    | RichTextItemRequest[];
  uses?: FinanceDatabaseResponse["properties"]["uses"]["select"]["name"];
};

export class FinanceDatabasePatchDTO {
  __data: UpdatePageBodyParameters;

  constructor(opts: {
    properties?: FinanceDatabasePropertiesPatch;
    coverUrl?: string;
    icon?: UpdatePageBodyParameters["icon"];
    archived?: UpdatePageBodyParameters["archived"];
  }) {
    const { properties: props, coverUrl, icon, archived } = opts;

    this.__data = {};
    this.__data.properties = {};
    this.__data.cover = coverUrl
      ? { type: "external", external: { url: coverUrl } }
      : undefined;
    this.__data.icon = icon;
    this.__data.archived = archived;

    if (props?.account !== undefined) {
      this.__data.properties["A%5B%5EX"] = {
        type: "select",
        select: { name: props.account },
      };
    }

    if (props?.checkBox !== undefined) {
      this.__data.properties.LHFX = {
        type: "checkbox",
        checkbox: props.checkBox,
      };
    }

    if (props?.amount !== undefined) {
      this.__data.properties.UMnH = {
        type: "number",
        number: props.amount,
      };
    }

    if (props?.receipt !== undefined) {
      this.__data.properties["VTP%3B"] = {
        type: "url",
        url: props.receipt,
      };
    }

    if (props?.category !== undefined) {
      this.__data.properties["%60%3Ev%5E"] = {
        type: "multi_select",
        multi_select: props.category?.map((item) => ({ name: item })),
      };
    }

    if (props?.date !== undefined) {
      this.__data.properties["fE%5Dg"] = {
        type: "date",
        date: props.date,
      };
    }

    if (props?.incomeexpense !== undefined) {
      this.__data.properties["k%3CsD"] = {
        type: "select",
        select: { name: props.incomeexpense },
      };
    }

    if (props?.notes !== undefined) {
      this.__data.properties.pSzF = {
        type: "rich_text",
        rich_text:
          typeof props.notes === "string"
            ? [{ type: "text", text: { content: props.notes } }]
            : !Array.isArray(props.notes)
            ? [
                {
                  type: "text",
                  text: {
                    content: props.notes.text,
                    link: props.notes.url
                      ? { url: props.notes.url }
                      : undefined,
                  },
                  annotations: props.notes.annotations,
                },
              ]
            : props.notes,
      };
    }

    if (props?.description !== undefined) {
      this.__data.properties.title = {
        type: "title",
        title:
          typeof props.description === "string"
            ? [{ type: "text", text: { content: props.description } }]
            : !Array.isArray(props.description)
            ? [
                {
                  type: "text",
                  text: {
                    content: props.description.text,
                    link: props.description.url
                      ? { url: props.description.url }
                      : undefined,
                  },
                  annotations: props.description.annotations,
                },
              ]
            : props.description,
      };
    }

    if (props?.uses !== undefined) {
      this.__data.properties["6dd9bbe4-5367-4799-a158-a81f04340de5"] = {
        type: "select",
        select: { name: props.uses },
      };
    }
  }
}
