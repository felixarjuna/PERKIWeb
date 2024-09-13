import { Client } from "@notionhq/client";
import { env } from "~/env.mjs";

export const notion = new Client({
  auth: env.NOTION_SECRET,
});
