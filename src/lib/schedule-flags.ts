/** Event flags a gathering can carry, shown as chips on the schedule. */
export const SCHEDULE_FLAGS = ["communion", "online", "putzdienst"] as const;
export type ScheduleFlag = (typeof SCHEDULE_FLAGS)[number];

export const FLAG_LABELS: Record<ScheduleFlag, string> = {
  communion: "Holy Communion",
  online: "Online",
  putzdienst: "Putzdienst",
};

/** Flags in their fixed order, without duplicates or unknown values. */
export const orderedFlags = (flags: readonly string[]): ScheduleFlag[] =>
  SCHEDULE_FLAGS.filter((flag) => flags.includes(flag));
