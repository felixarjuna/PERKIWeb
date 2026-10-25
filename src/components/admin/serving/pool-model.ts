import {
  POOL_ROLES,
  type PoolRole,
  type ShownStatus,
  statusLabels,
} from "~/lib/serving-pool";

export interface PoolFilters {
  q: string;
  /** One role, or "" for every role. */
  role: PoolRole | "";
  /** One status, or "" for every status. */
  status: ShownStatus | "";
}

const STATUSES = Object.keys(statusLabels) as ShownStatus[];
const COMBINING_MARKS = /\p{M}/gu;

const fold = (value: string) =>
  value.normalize("NFD").replace(COMBINING_MARKS, "").toLowerCase();

/** `/admin/serving` URL parameters: `q`, `role` and `status`. */
export function readPoolFilters(params: URLSearchParams): PoolFilters {
  const role = params.get("role") ?? "";
  const status = params.get("status") ?? "";
  return {
    q: params.get("q") ?? "",
    role: POOL_ROLES.find((item) => item === role) ?? "",
    status: STATUSES.find((item) => item === status) ?? "",
  };
}

export function matchesPool(
  entry: {
    role: PoolRole;
    status: ShownStatus;
    user: { email: string | null; name: string | null };
  },
  filters: PoolFilters
) {
  const q = fold(filters.q.trim());
  const text = fold(`${entry.user.name ?? ""} ${entry.user.email ?? ""}`);
  return (
    (!q || text.includes(q)) &&
    (!filters.role || entry.role === filters.role) &&
    (!filters.status || entry.status === filters.status)
  );
}
