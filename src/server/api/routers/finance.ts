import { type DatabaseObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { notion } from "~/lib/notion";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const financeRouter = createTRPCRouter({
  getFinances: publicProcedure.query(async () => {
    const response = await notion.databases.query({
      database_id: "1301c1f98b49400e89aa46cc5ec0bee7",
      sorts: [
        {
          timestamp: "created_time",
          direction: "descending",
        },
      ],
      page_size: 2,
    });

    return response.results as DatabaseObjectResponse[];
  }),
});
