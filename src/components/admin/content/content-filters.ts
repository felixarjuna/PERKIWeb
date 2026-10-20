interface ScheduleSummary {
  date: Date;
  description: string;
  id: number;
  leader?: string | null;
  preacher: string | null;
  title: string;
  type: string;
}
export interface ContentFilters {
  order: string;
  period?: string;
  q: string;
  type: string;
}
export function filterSchedules<T extends ScheduleSummary>(
  records: T[],
  filters: ContentFilters,
  now: Date
): T[] {
  const query = filters.q.trim().toLowerCase();
  return records
    .filter(
      (record) =>
        `${record.title} ${record.preacher ?? ""} ${record.leader ?? ""}`
          .toLowerCase()
          .includes(query) &&
        (filters.type === "all" || record.type === filters.type) &&
        (filters.period !== "upcoming" || record.date >= now) &&
        (filters.period !== "past" || record.date < now)
    )
    .sort(
      (a, b) =>
        (a.date.getTime() - b.date.getTime()) *
          (filters.order === "asc" ? 1 : -1) || a.id - b.id
    );
}
export function filterTakeaways<
  T extends {
    schedules: Pick<ScheduleSummary, "title" | "type" | "date">;
    takeaways: { id: number; keypoints: string };
  },
>(records: T[], filters: ContentFilters): T[] {
  const query = filters.q.trim().toLowerCase();
  return records
    .filter(
      (record) =>
        `${record.schedules.title} ${record.takeaways.keypoints}`
          .toLowerCase()
          .includes(query) &&
        (filters.type === "all" || record.schedules.type === filters.type)
    )
    .sort(
      (a, b) =>
        (a.schedules.date.getTime() - b.schedules.date.getTime()) *
          (filters.order === "asc" ? 1 : -1) || a.takeaways.id - b.takeaways.id
    );
}
