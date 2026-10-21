import { api } from "~/trpc/react";

/** Names of the groups in force today, for the cooking and cleaning pickers. */
export function useGroupNames() {
  const { data: term } = api.groups.getCurrent.useQuery();
  return term?.groups.map((group) => group.name) ?? [];
}
