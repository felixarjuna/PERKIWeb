"use client";

import React from "react";
import Loader from "~/components/loader";
import { getWeekdayInCurrentWeek } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import ScheduleCard from "./schedule-card";

type Schedule = RouterOutputs["schedules"]["getSchedules"][number];

export default function ScheduleList() {
  const { data: schedules } = api.schedules.getSchedules.useQuery();

  function renderScheduleCollection(
    list: Schedule[] | undefined,
    loadingMessage: string
  ) {
    if (!list) {
      return <Loader message={loadingMessage} />;
    }

    if (list.length === 0) {
      return (
        <p className="type-body rounded-xl bg-card p-4 text-muted-foreground sm:p-6">
          No gatherings scheduled here yet.
        </p>
      );
    }

    return list.map((schedule) => (
      <ScheduleCard key={schedule.id} schedule={schedule} />
    ));
  }

  const thisWeekSchedule = React.useMemo(() => {
    const sundayDate = getWeekdayInCurrentWeek(new Date(), 0);
    const saturdayDate = getWeekdayInCurrentWeek(new Date(), 6);

    return schedules
      ?.filter(
        (schedule) => schedule.date > sundayDate && schedule.date < saturdayDate
      )
      .sort((a, b) => {
        if (a.date > b.date) {
          return 1;
        }
        return -1;
      });
  }, [schedules]);

  function renderThisWeekSchedule() {
    return (
      <div className="space-y-4">
        <h2 className="type-heading">This Week</h2>
        {renderScheduleCollection(
          thisWeekSchedule,
          "Loading this week schedules ..."
        )}
      </div>
    );
  }

  const upcomingSchedules = React.useMemo(() => {
    const saturdayDate = getWeekdayInCurrentWeek(new Date(), 6);
    return schedules
      ?.filter((schedule) => schedule.date > saturdayDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [schedules]);

  function renderUpcomingSchedule() {
    return (
      <div className="space-y-4">
        <h2 className="type-heading">Upcoming Schedules</h2>
        {renderScheduleCollection(
          upcomingSchedules,
          "Loading upcoming schedules ..."
        )}
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const previousSchedules = React.useMemo(() => {
    const sundayDate = getWeekdayInCurrentWeek(new Date(), 0);
    return schedules?.filter((schedule) => schedule.date < sundayDate);
  }, [schedules]);

  function renderPreviousSchedule() {
    return (
      <div className="space-y-4">
        <h2 className="type-heading">Previous Schedules</h2>
        {renderScheduleCollection(
          previousSchedules,
          "Loading previous schedules ..."
        )}
      </div>
    );
  }

  return (
    <section className="mt-8 space-y-8">
      {renderThisWeekSchedule()}
      {renderUpcomingSchedule()}
      {renderPreviousSchedule()}
    </section>
  );
}
