"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@radix-ui/react-label";
import { format } from "date-fns";
import { GoogleSpreadsheet } from "google-spreadsheet";

import { ArrowLeft, CalendarIcon } from "lucide-react";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import type { z } from "zod";
import Loader from "~/components/loader";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { env } from "~/env.mjs";
import {
  accommodation,
  groupNames,
  liturgos,
  multimedia,
  musicians,
  noteWriter,
  speakers,
} from "~/lib/data";
import { eventTypeEnum, type NewSchedule } from "~/lib/db/schema/schema";
import { cn } from "~/lib/utils";
import { addScheduleSchema } from "~/server/api/schema/schema";
import { api } from "~/trpc/react";

export default function AddScheduleForm() {
  /** form definition. */
  const form = useForm<z.infer<typeof addScheduleSchema>>({
    defaultValues: {},
    resolver: zodResolver(addScheduleSchema),
  });

  /** add schedule action. */
  const router = useRouter();
  const utils = api.useUtils();
  const addSchedule = api.schedules.addSchedule.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.schedules.invalidate(),
        utils.takeaways.invalidate(),
      ]);
      toast.success("New schedule added!", {
        description: "Thanks for your contributions!",
      });
      router.push("/schedule");
    },
  });
  function onSubmit(values: z.infer<typeof addScheduleSchema>) {
    addSchedule.mutate(values);
  }

  return (
    <Tabs className="mt-8" defaultValue="manual">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manual">Manual</TabsTrigger>
        <TabsTrigger value="spreadsheet">Google Spreadsheet</TabsTrigger>
      </TabsList>
      <TabsContent value="manual">
        <Form {...form}>
          <form
            className="mt-4 space-y-8 sm:mt-8"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="space-y-4">
              <h3 className="font-reimbrandt text-2xl sm:text-3xl">
                Fellowship Information
              </h3>
              <section className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-md">
                          Fellowship Type
                        </FormLabel>
                        <FormControl>
                          <Select
                            defaultValue={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select the fellowship type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(eventTypeEnum.enumValues).map(
                                ([key, value]) => (
                                  <SelectItem key={key} value={value}>
                                    {value === "church_service"
                                      ? "Church service"
                                      : "Bible study"}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-md">Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-md">Date</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  className={cn(
                                    "!text-foreground pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  variant={"default"}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              align="start"
                              className="w-auto p-1"
                            >
                              <Calendar
                                autoFocus
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                mode="single"
                                onSelect={field.onChange}
                                selected={field.value}
                              />
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="preacher"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-md">Preacher</FormLabel>
                        <FormControl>
                          <Select
                            defaultValue={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a speaker for the service" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {speakers.map((speaker) => (
                                <SelectItem key={speaker} value={speaker}>
                                  {speaker}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="bibleVerse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-md">Bible Verse</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-md">Description</FormLabel>
                        <FormControl>
                          <Textarea className="h-48 resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>
            </div>

            <div className="space-y-4">
              <h3 className="font-reimbrandt text-2xl sm:text-3xl">
                Servant Information
              </h3>
              <section className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="leader"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-md">Liturgos</FormLabel>
                        <FormControl>
                          <Select
                            defaultValue={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {liturgos.map((leader) => (
                                <SelectItem key={leader} value={leader}>
                                  {leader}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="musician"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-md">Musician</FormLabel>
                        <FormControl>
                          <Select
                            defaultValue={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {musicians.map((musician) => (
                                <SelectItem key={musician} value={musician}>
                                  {musician}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="noteWriter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-md">Note writer</FormLabel>
                        <FormControl>
                          <Select
                            defaultValue={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {noteWriter.map((writer) => (
                                <SelectItem key={writer} value={writer}>
                                  {writer}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="multimedia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-md">Multimedia</FormLabel>
                        <FormControl>
                          <Select
                            defaultValue={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {multimedia.map((mediator) => (
                                <SelectItem key={mediator} value={mediator}>
                                  {mediator}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="accommodation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-md">Accommodation</FormLabel>
                        <FormControl>
                          <Select
                            defaultValue={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {accommodation.map((accomodator) => (
                                <SelectItem
                                  key={accomodator}
                                  value={accomodator}
                                >
                                  {accomodator}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="cookingGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-md">Cooking Group</FormLabel>
                        <FormControl>
                          <Select
                            defaultValue={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {groupNames.map((group) => (
                                <SelectItem key={group} value={group}>
                                  {group}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="cleaningGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-md">
                          Cleaning Group
                        </FormLabel>
                        <FormControl>
                          <Select
                            defaultValue={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {groupNames.map((group) => (
                                <SelectItem key={group} value={group}>
                                  {group}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>
            </div>

            <div className="flex justify-between">
              <Button type="submit" variant={"default"}>
                Add schedule
              </Button>
              <Button className="flex gap-x-2" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>
      <TabsContent value="spreadsheet">
        <AddScheduleGoogleSpreadsheet />
      </TabsContent>
    </Tabs>
  );
}

interface SpreadsheetSchedule {
  Acara: "Kebaktian" | "Penelaahaan Alkitab";
  Akomodasi: string;
  "Bible verse": string;
  Catatan: string;
  "Event Description": string;
  "Event Title": string;
  Leader: string;
  Liturgis: string;
  Masak: string;
  Multimedia: string;
  Musik: string;
  Piket: string;
  Preacher: string;
  Tanggal: string;
}

const doc = new GoogleSpreadsheet(
  "1McH8SoN1ut6CfERNi6BSh45O8vhshfZElDA42FbTZMs",
  { apiKey: env.NEXT_PUBLIC_GOOGLE_API_KEY }
);

function AddScheduleGoogleSpreadsheet() {
  const router = useRouter();

  /** state for loaded schedules. */
  const [schedules, setSchedules] = React.useState<NewSchedule[]>();

  /** state for loading status. */
  const [loading, setLoading] = React.useState<boolean>(false);

  /** state for rows to be loaded. */
  const [options, setOptions] = React.useState<{
    offset?: number;
    limit?: number;
  }>({ limit: 4 });

  const [_options] = useDebounce(options, 1500);

  React.useEffect(() => {
    setLoading(true);

    const load = async () => {
      try {
        await doc.loadInfo();

        const schedule = doc.sheetsByTitle.Schedule;
        const rows = await schedule?.getRows(_options);
        const _rows = rows?.map((x) => x.toObject()) as SpreadsheetSchedule[];

        const loadedSchedules = _rows.map((x) => {
          const newSchedule: NewSchedule = {
            accommodation: x.Akomodasi,
            bibleVerse: x["Bible verse"],
            cleaningGroup: x.Piket,
            cookingGroup: x.Masak,
            date: DateTime.fromFormat(x.Tanggal, "d.M.yyyy").toJSDate(),
            description: x["Event Description"],
            leader: x.Acara === "Kebaktian" ? x.Liturgis : x.Leader,
            multimedia: x.Multimedia,
            musician: x.Musik,
            noteWriter: x.Catatan,
            preacher: x.Preacher,
            title: x["Event Title"],
            type: x.Acara === "Kebaktian" ? "church_service" : "bible_study",
          };

          return newSchedule;
        });

        setSchedules(loadedSchedules);
        setLoading(false);
      } catch {
        setLoading(false);
        toast.error("Error", {
          description:
            "Error occurs when loading data from spreadsheet. Some data could not be fetched.",
        });
      }
    };

    load();
  }, [_options]);

  /** add schedules action. */
  const utils = api.useUtils();
  const addScheduleBatch = api.schedules.addScheduleBatch.useMutation({
    onError: (err) => {
      toast.error("Error", {
        description: `An error occured while adding schedules. Error: ${err.message}.`,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        utils.schedules.invalidate(),
        utils.takeaways.invalidate(),
      ]);
      toast.success("New schedules added!", {
        description: "Thanks for your contributions!",
      });
      router.push("/schedule");
    },
  });

  return (
    <div className="mt-4 grid gap-y-4 sm:mt-8">
      <div className="grid gap-y-2 overflow-hidden">
        <h1 className="font-reimbrandt text-2xl">Settings</h1>
        <div className="grid grid-cols-2 gap-x-2">
          <div className="col-span-1 grid gap-2">
            <Label className="text-sm">Offset</Label>
            <Input
              defaultValue={0}
              onChange={(e) =>
                setOptions((opts) => ({ ...opts, offset: +e.target.value }))
              }
              type="number"
            />
          </div>
          <div className="col-span-1 grid gap-2">
            <Label className="text-sm">Limit</Label>
            <Input
              defaultValue={4}
              onChange={(e) =>
                setOptions((opts) => ({ ...opts, limit: +e.target.value }))
              }
              type="number"
            />
          </div>
        </div>
      </div>

      <div className={loading ? "" : "overflow-auto"}>
        <h1 className="font-reimbrandt text-2xl">Data Preview</h1>

        {loading || addScheduleBatch.isPending ? (
          <div className="mt-4 w-full">
            <Loader
              message={
                loading
                  ? "Loading schedules from spreadsheet ..."
                  : "Adding schedules to database ..."
              }
            />
          </div>
        ) : (
          <>
            <div className="my-4 flex max-h-72 flex-col gap-2 overflow-x-scroll overflow-y-scroll">
              <pre className="text-sm">
                {JSON.stringify(schedules, null, 2)}
              </pre>
            </div>

            <div className="mt-8 flex justify-between">
              <Button
                onClick={() => {
                  if (!schedules) {
                    toast.error("Error", {
                      description:
                        "Row is empty. Could not add empty schedules.",
                    });
                    return;
                  }

                  const _schedules = schedules.map((x) => ({
                    ...x,
                    accommodation: x.accommodation ?? undefined,
                    cookingGroup: x.cookingGroup ?? undefined,
                    multimedia: x.multimedia ?? undefined,
                    preacher: x.preacher ?? undefined,
                  }));
                  addScheduleBatch.mutate(_schedules);
                }}
                type="submit"
                variant={"default"}
              >
                Add schedules
              </Button>
              <Button className="flex gap-x-2" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
