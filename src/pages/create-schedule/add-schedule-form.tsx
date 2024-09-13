import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@radix-ui/react-label";
import { format } from "date-fns";
import { GoogleSpreadsheet } from "google-spreadsheet";

import { ArrowLeft, CalendarIcon } from "lucide-react";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";

import { type z } from "zod";
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
import { useToast } from "~/components/ui/use-toast";
import { env } from "~/env.mjs";
import {
  accommodation,
  groups,
  liturgos,
  multimedia,
  musicians,
  noteWriter,
  speakers,
} from "~/lib/data";
import { eventTypeEnum, type NewSchedule } from "~/lib/db/schema/schema";
import { cn } from "~/lib/utils";
import { addScheduleSchema } from "~/server/api/schema/schema";
import { api } from "~/utils/api";

export default function AddScheduleForm() {
  /** form definition. */
  const form = useForm<z.infer<typeof addScheduleSchema>>({
    resolver: zodResolver(addScheduleSchema),
    defaultValues: {},
  });

  /** add schedule action. */
  const { toast } = useToast();
  const router = useRouter();
  const addSchedule = api.schedules.addSchedule.useMutation({
    onSuccess: () => {
      toast({
        title: "New schedule added! 🎉",
        description: "Thanks for your contributions!",
      });
      router.push("/schedule");
    },
  });
  function onSubmit(values: z.infer<typeof addScheduleSchema>) {
    addSchedule.mutate(values);
  }

  return (
    <Tabs defaultValue="manual" className="mx-auto mt-8 sm:max-w-xl">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manual">Manual</TabsTrigger>
        <TabsTrigger value="spreadsheet">Google Spreadsheet</TabsTrigger>
      </TabsList>
      <TabsContent value="manual">
        <Form {...form}>
          <form
            onSubmit={(event) => {
              try {
                void form.handleSubmit(onSubmit, (error) => console.log(error))(
                  event,
                );
              } catch (exception) {
                console.log(exception);
              }
            }}
            className="mt-4 space-y-8 sm:mt-8"
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
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select the fellowship type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(eventTypeEnum.enumValues).map(
                                ([key, value]) => (
                                  <SelectItem value={value} key={key}>
                                    {value === "church_service"
                                      ? "Church service"
                                      : "Bible study"}
                                  </SelectItem>
                                ),
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
                          <Input {...field}></Input>
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
                                  variant={"default"}
                                  className={cn(
                                    "pl-3 text-left font-normal !text-cream-default",
                                    !field.value && "text-muted-foreground",
                                  )}
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
                              className="w-auto p-1"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
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
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a speaker for the service" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {speakers.map((speaker, index) => (
                                <SelectItem value={speaker} key={index}>
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
                          <Input {...field}></Input>
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
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {liturgos.map((liturgos, index) => (
                                <SelectItem value={liturgos} key={index}>
                                  {liturgos}
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
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {musicians.map((musician, index) => (
                                <SelectItem value={musician} key={index}>
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
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {noteWriter.map((writer, index) => (
                                <SelectItem value={writer} key={index}>
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
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {multimedia.map((mediator, index) => (
                                <SelectItem value={mediator} key={index}>
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
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {accommodation.map((accomodator, index) => (
                                <SelectItem value={accomodator} key={index}>
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
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {groups.map((group, index) => (
                                <SelectItem value={group} key={index}>
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
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {groups.map((group, index) => (
                                <SelectItem value={group} key={index}>
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

type SpreadsheetSchedule = {
  "Event Title": string;
  "Event Description": string;
  "Bible verse": string;
  Tanggal: string;
  Acara: "Kebaktian" | "Penelaahaan Alkitab";
  Preacher: string;
  Liturgis: string;
  Leader: string;
  Catatan: string;
  Akomodasi: string;
  Multimedia: string;
  Musik: string;
  Masak: string;
  Piket: string;
};

const doc = new GoogleSpreadsheet(
  "1x7GkA_-LR31Cw2Wfat2S38N79k26DcyhhEEW2ZmKuic",
  { apiKey: env.NEXT_PUBLIC_GOOGLE_API_KEY },
);

function AddScheduleGoogleSpreadsheet() {
  const { toast } = useToast();
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

        const schedules = _rows.map((x) => {
          const schedule: NewSchedule = {
            title: x["Event Title"],
            description: x["Event Description"],
            bibleVerse: x["Bible verse"],
            type: x.Acara === "Kebaktian" ? "church_service" : "bible_study",
            date: DateTime.fromFormat(x.Tanggal, "d.M.yyyy").toJSDate(),
            preacher: x.Preacher,
            leader: x.Acara === "Kebaktian" ? x.Liturgis : x.Leader,
            musician: x.Musik,
            noteWriter: x.Catatan,
            cookingGroup: x.Masak,
            cleaningGroup: x.Piket,
            accommodation: x.Akomodasi,
            multimedia: x.Multimedia,
          };

          return schedule;
        });

        setSchedules(schedules);
        setLoading(false);
      } catch (exception) {
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Error occurs when loading data from spreadsheet. Some data could not be fetched.`,
        });
      }
    };

    void load();
  }, [toast, _options]);

  /** add schedules action. */
  const addScheduleBatch = api.schedules.addScheduleBatch.useMutation({
    onSuccess: () => {
      toast({
        title: "New schedules added! 🎉",
        description: "Thanks for your contributions!",
      });
      router.push("/schedule");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error occurs when adding schedules.",
      });
    },
  });

  return (
    <div className="mt-4 grid gap-y-4 sm:mt-8">
      <div className="grid gap-y-2 overflow-hidden">
        <h1 className="font-reimbrandt text-2xl">Settings</h1>
        <div className="grid grid-cols-2 gap-x-2">
          <div className="col-span-1 grid  gap-2">
            <Label className="text-sm">Offset</Label>
            <Input
              type="number"
              defaultValue={0}
              onChange={(e) =>
                setOptions((opts) => ({ ...opts, offset: +e.target.value }))
              }
            />
          </div>
          <div className="col-span-1 grid  gap-2">
            <Label className="text-sm">Limit</Label>
            <Input
              type="number"
              defaultValue={4}
              onChange={(e) =>
                setOptions((opts) => ({ ...opts, limit: +e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      <div className={loading ? "" : "overflow-auto"}>
        <h1 className="font-reimbrandt text-2xl">Data Preview</h1>

        {loading || addScheduleBatch.isLoading ? (
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
                type="submit"
                variant={"default"}
                onClick={() => {
                  const _schedules = schedules?.map((x) => ({
                    ...x,
                    preacher: x.preacher ?? undefined,
                    multimedia: x.multimedia ?? undefined,
                    accommodation: x.accommodation ?? undefined,
                    cookingGroup: x.cookingGroup ?? undefined,
                  }));
                  if (_schedules === undefined) {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description:
                        "Row is empty. Could not add empty schedules.",
                    });
                    return;
                  }

                  addScheduleBatch.mutate(_schedules);
                }}
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
