import { type FinanceDatabaseResponse } from "~/lib/notion/finance-database";
import { notion } from "~/lib/notion/notion";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const financeRouter = createTRPCRouter({
  getFinances: publicProcedure.query(async () => {
    let results: FinanceDatabaseResponse[] = [];
    let hasMore = true;
    let cursor: string | undefined = undefined;

    while (hasMore) {
      const response = await notion.databases.query({
        database_id: "1301c1f98b49400e89aa46cc5ec0bee7",
        sorts: [
          {
            timestamp: "created_time",
            direction: "descending",
          },
        ],
        start_cursor: cursor,
        page_size: 100,
      });

      results = [
        ...results,
        ...(response.results as unknown as FinanceDatabaseResponse[]),
      ];
      hasMore = response.has_more;
      cursor = response.next_cursor ?? undefined;
    }

    return results.sort(
      (x, y) =>
        new Date(x.properties.Date.date?.start ?? new Date()).getTime() -
        new Date(y.properties.Date.date?.start ?? new Date()).getTime(),
    );
  }),
});
