import { type FinanceDatabaseResponse } from "./types";

export class FinanceDatabaseResponseDTO {
  __data: FinanceDatabaseResponse;
  id: FinanceDatabaseResponse["id"];
  title: FinanceDatabaseResponse["title"];
  description: FinanceDatabaseResponse["description"];
  parent: FinanceDatabaseResponse["parent"];
  createdBy: FinanceDatabaseResponse["created_by"];
  lastEditedBy: FinanceDatabaseResponse["last_edited_by"];
  createdTime: FinanceDatabaseResponse["created_time"];
  lastEditedTime: FinanceDatabaseResponse["last_edited_time"];
  isInline: FinanceDatabaseResponse["is_inline"];
  archived: FinanceDatabaseResponse["archived"];
  url: FinanceDatabaseResponse["url"];
  publicUrl: FinanceDatabaseResponse["public_url"];
  properties: FinanceDatabasePropertiesResponseDTO;

  constructor(res: FinanceDatabaseResponse) {
    this.__data = res;
    this.id = res.id;
    this.title = res.title;
    this.description = res.description;
    this.parent = res.parent;
    this.createdBy = res.created_by;
    this.lastEditedBy = res.last_edited_by;
    this.createdTime = res.created_time;
    this.lastEditedTime = res.last_edited_time;
    this.isInline = res.is_inline;
    this.archived = res.archived;
    this.url = res.url;
    this.publicUrl = res.public_url;
    this.properties = new FinanceDatabasePropertiesResponseDTO(res.properties);
  }

  get cover() {
    return {
      type: this.__data.cover?.type,
      url:
        this.__data.cover?.type === "external"
          ? this.__data.cover?.external?.url
          : this.__data.cover?.file?.url,
    };
  }

  get icon() {
    return {
      type: this.__data.icon?.type,
      url:
        this.__data.icon?.type === "external"
          ? this.__data.icon?.external?.url
          : this.__data.icon?.type === "file"
          ? this.__data.icon?.file?.url
          : undefined,
      emoji:
        this.__data.icon?.type === "emoji"
          ? this.__data.icon?.emoji
          : undefined,
    };
  }
}

export class FinanceDatabasePropertiesResponseDTO {
  __props: FinanceDatabaseResponse["properties"];
  __data;

  constructor(props: FinanceDatabaseResponse["properties"]) {
    this.__props = props;
    this.__data = {
      account: this.__props.Account,
      checkBox: this.__props["Check Box"],
      amount: this.__props.Amount,
      receipt: this.__props.Receipt,
      category: this.__props.Category,
      date: this.__props.Date,
      incomeexpense: this.__props["income/expense"],
      notes: this.__props.Notes,
      description: this.__props.Description,
      uses: this.__props.uses,
    };
  }

  get account() {
    return this.__props.Account?.select;
  }

  get checkBox() {
    return this.__props["Check Box"]?.checkbox;
  }

  get amount() {
    return this.__props.Amount?.number;
  }

  get receipt() {
    return this.__props.Receipt?.url;
  }
  get category() {
    return {
      values: this.__props.Category?.multi_select
        ? this.__props.Category.multi_select.map((item) => item.name)
        : [],
      multi_select: this.__props.Category?.multi_select,
    };
  }

  get date() {
    return this.__props.Date?.date;
  }

  get incomeexpense() {
    return this.__props["income/expense"]?.select;
  }

  get notes() {
    return {
      text: this.__props.Notes?.rich_text
        ? this.__props.Notes.rich_text.reduce(
            (acc, item) => acc + item.plain_text,
            "",
          )
        : undefined,
      links: this.__props.Notes?.rich_text
        ? this.__props.Notes.rich_text
            .filter((item) => item.href?.length)
            .map((item) => item.href)
        : [],
      rich_text: this.__props.Notes?.rich_text,
    };
  }

  get description() {
    return {
      text: this.__props.Description?.title
        ? this.__props.Description.title.reduce(
            (acc, item) => acc + item.plain_text,
            "",
          )
        : undefined,
      links: this.__props.Description?.title
        ? this.__props.Description.title
            .filter((item) => item.href?.length)
            .map((item) => item.href)
        : [],
      title: this.__props.Description?.title,
    };
  }

  get uses() {
    return this.__props.uses?.select;
  }
}
