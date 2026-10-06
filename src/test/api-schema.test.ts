import { describe, expect, it } from "vitest";
import {
  addPrayerCountSchema,
  addPrayerSchema,
  addProfileSchema,
  addScheduleBatchSchema,
  addScheduleSchema,
  addTakeawaySchema,
  editPrayerSchema,
  queryByIdSchema,
  updateScheduleSchema,
  updateTakeawaySchema,
} from "~/server/api/schema/schema";

const validSchedule = {
  bibleVerse: "John 3:16",
  cleaningGroup: "Group A",
  date: new Date("2025-10-12T10:00:00Z"),
  description: "Sunday service",
  leader: "Leader",
  musician: "Musician",
  noteWriter: "Writer",
  title: "Service",
  type: "church_service" as const,
};

const issuePaths = (result: {
  error?: { issues: { path: PropertyKey[] }[] };
}) => result.error?.issues.map((issue) => issue.path.join(".")) ?? [];

describe("addScheduleSchema", () => {
  it("accepts a valid schedule without optional fields", () => {
    expect(addScheduleSchema.safeParse(validSchedule).success).toBe(true);
  });

  it("accepts all optional fields", () => {
    const result = addScheduleSchema.safeParse({
      ...validSchedule,
      accommodation: "Room 1",
      cookingGroup: "Group B",
      multimedia: "Media",
      preacher: "Pastor",
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ["2 characters", "ab", true],
    ["50 characters", "x".repeat(50), true],
    ["1 character", "a", false],
    ["51 characters", "x".repeat(51), false],
    ["empty", "", false],
  ])("title with %s -> valid=%s", (_label, title, valid) => {
    expect(
      addScheduleSchema.safeParse({ ...validSchedule, title }).success
    ).toBe(valid);
  });

  it("uses the custom message for a too-short title", () => {
    const result = addScheduleSchema.safeParse({
      ...validSchedule,
      title: "a",
    });
    expect(result.error?.issues[0]?.message).toBe(
      "An event must have a title with at least 2 characters."
    );
  });

  it.each(["church_service", "bible_study"])("accepts type %s", (type) => {
    expect(
      addScheduleSchema.safeParse({ ...validSchedule, type }).success
    ).toBe(true);
  });

  it.each(["prayer", "", "CHURCH_SERVICE"])("rejects type %j", (type) => {
    const result = addScheduleSchema.safeParse({ ...validSchedule, type });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual(["type"]);
  });

  it("requires a Date (not a string) with the custom message", () => {
    const missing = addScheduleSchema.safeParse({
      ...validSchedule,
      date: undefined,
    });
    expect(missing.error?.issues[0]?.message).toBe(
      "A date of service is required."
    );
    expect(
      addScheduleSchema.safeParse({
        ...validSchedule,
        date: "2025-10-12",
      }).success
    ).toBe(false);
  });

  it("requires a description of at least 2 characters", () => {
    const result = addScheduleSchema.safeParse({
      ...validSchedule,
      description: "x",
    });
    expect(result.error?.issues[0]?.message).toBe(
      "An event must have a description with at least 2 characters."
    );
  });

  it.each(["bibleVerse", "cleaningGroup", "leader", "musician", "noteWriter"])(
    "enforces 2-50 characters on %s",
    (field) => {
      expect(
        addScheduleSchema.safeParse({ ...validSchedule, [field]: "x" }).success
      ).toBe(false);
      expect(
        addScheduleSchema.safeParse({
          ...validSchedule,
          [field]: "x".repeat(51),
        }).success
      ).toBe(false);
    }
  );

  it("reports every missing required field", () => {
    const result = addScheduleSchema.safeParse({});
    expect(issuePaths(result).sort()).toEqual(
      [
        "bibleVerse",
        "cleaningGroup",
        "date",
        "description",
        "leader",
        "musician",
        "noteWriter",
        "title",
        "type",
      ].sort()
    );
  });
});

describe("addScheduleBatchSchema / updateScheduleSchema", () => {
  it("validates every schedule in a batch and reports the index", () => {
    const result = addScheduleBatchSchema.safeParse([
      validSchedule,
      { ...validSchedule, title: "a" },
    ]);
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual(["1.title"]);
  });

  it("accepts an empty batch", () => {
    expect(addScheduleBatchSchema.safeParse([]).success).toBe(true);
  });

  it("requires a numeric id for updates", () => {
    expect(updateScheduleSchema.safeParse(validSchedule).success).toBe(false);
    expect(
      updateScheduleSchema.safeParse({ ...validSchedule, id: 1 }).success
    ).toBe(true);
    expect(
      updateScheduleSchema.safeParse({ ...validSchedule, id: "1" }).success
    ).toBe(false);
  });
});

describe("takeaway schemas", () => {
  const takeaway = { contributors: ["a"], keypoints: "k", scheduleId: 1 };

  it("accepts a valid takeaway, including no contributors", () => {
    expect(addTakeawaySchema.safeParse(takeaway).success).toBe(true);
    expect(
      addTakeawaySchema.safeParse({ ...takeaway, contributors: [] }).success
    ).toBe(true);
  });

  it("rejects non-numeric scheduleId", () => {
    expect(
      addTakeawaySchema.safeParse({ ...takeaway, scheduleId: "1" }).success
    ).toBe(false);
  });

  it("requires id on update", () => {
    expect(updateTakeawaySchema.safeParse(takeaway).success).toBe(false);
    expect(updateTakeawaySchema.safeParse({ ...takeaway, id: 3 }).success).toBe(
      true
    );
  });
});

describe("prayer schemas", () => {
  const prayer = {
    content: "Pray for us",
    isAnonymous: false,
    prayerNames: [],
  };

  it("accepts a valid prayer with optional name omitted", () => {
    expect(addPrayerSchema.safeParse(prayer).success).toBe(true);
  });

  it("enforces 2-50 characters on content", () => {
    expect(addPrayerSchema.safeParse({ ...prayer, content: "x" }).success).toBe(
      false
    );
    expect(
      addPrayerSchema.safeParse({ ...prayer, content: "x".repeat(51) }).success
    ).toBe(false);
  });

  it("requires isAnonymous to be a boolean", () => {
    expect(
      addPrayerSchema.safeParse({ ...prayer, isAnonymous: "false" }).success
    ).toBe(false);
  });

  it("requires id on edit", () => {
    expect(editPrayerSchema.safeParse(prayer).success).toBe(false);
    expect(editPrayerSchema.safeParse({ ...prayer, id: 1 }).success).toBe(true);
  });

  it("validates prayer counts", () => {
    expect(
      addPrayerCountSchema.safeParse({ count: 2, id: 1, prayerNames: ["a"] })
        .success
    ).toBe(true);
    expect(
      addPrayerCountSchema.safeParse({ count: "2", id: 1, prayerNames: [] })
        .success
    ).toBe(false);
  });
});

describe("queryByIdSchema", () => {
  it("requires a numeric id", () => {
    expect(queryByIdSchema.safeParse({ id: 1 }).success).toBe(true);
    expect(queryByIdSchema.safeParse({ id: "1" }).success).toBe(false);
    expect(queryByIdSchema.safeParse({}).success).toBe(false);
  });
});

describe("addProfileSchema", () => {
  const profile = {
    address: "Street 1",
    birthday: new Date(2000, 0, 1),
    location: "Aachen",
    major: "CS",
    phoneNumber: "+49123",
    userId: "user-1",
  };

  it("accepts a profile with optional bio omitted", () => {
    expect(addProfileSchema.safeParse(profile).success).toBe(true);
  });

  it("requires birthday to be a Date", () => {
    expect(
      addProfileSchema.safeParse({ ...profile, birthday: "2000-01-01" }).success
    ).toBe(false);
  });

  it("requires userId", () => {
    const { userId: _userId, ...withoutUser } = profile;
    expect(addProfileSchema.safeParse(withoutUser).success).toBe(false);
  });
});
