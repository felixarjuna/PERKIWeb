import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/ui/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { accommodation, groups, liturgos, multimedia, musicians, speakers } from "@/lib/data";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function AddSchedulePage() {
  return (
    <section className="bg-dark-green-default text-cream-default pb-40 min-h-screen">
      <Navigation showNav={true} />

      <div className="pt-20 px-24 flex flex-col items-center">
        <div className="flex w-1/2 items-center justify-center gap-8 pt-16 pb-4 flex-col">
          <h1 className="text-9xl font-reimbrandt">Schedule</h1>
          <div className="text-2xl flex flex-col gap-y-2">
            <p>
              “There is a time for everything, and a season for every activity under the heavens.”
            </p>
            <p>– Ecclesiastes 3:1</p>
          </div>
        </div>

        <div className="w-1/2">
          <AddScheduleForm />
        </div>
      </div>
    </section>
  );
}

const addScheduleSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }).max(50),
  date: z.date({
    required_error: "A date of service is required.",
  }),
  speaker: z.string({
    required_error: "Please select a speaker for the service.",
  }),
  bibleVerse: z.string().min(2).max(50),
  summary: z.string().min(2).max(50),
  liturgos: z.string().min(2).max(50).optional(),
  musician: z.string().min(2).max(50).optional(),
  multimedia: z.string().min(2).max(50).optional(),
  accommodation: z.string().min(2).max(50).optional(),
  cookingGroup: z.string().min(2).max(50).optional(),
  cleaningGroup: z.string().min(2).max(50).optional(),
});

function AddScheduleForm() {
  // 1. Define form.
  const form = useForm<z.infer<typeof addScheduleSchema>>({
    resolver: zodResolver(addScheduleSchema),
    defaultValues: {},
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof addScheduleSchema>) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-8">
        <div className="space-y-4">
          <h3 className="font-reimbrandt text-3xl">Fellowship/Service Information</h3>
          <section className="grid grid-cols-2 gap-4">
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
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-1" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="speaker"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md">Speaker</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <div className="col-span-2">
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-md">Summary</FormLabel>
                    <FormControl>
                      <Textarea className="resize-none h-48" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <h3 className="font-reimbrandt text-3xl">Servant Information</h3>
          <section className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="liturgos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md">Liturgos</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <FormField
              control={form.control}
              name="musician"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md">Musician</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <FormField
              control={form.control}
              name="multimedia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md">Multimedia</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <FormField
              control={form.control}
              name="accommodation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md">Accommodation</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <FormField
              control={form.control}
              name="cookingGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md">Cooking Group</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <FormField
              control={form.control}
              name="cleaningGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md">Cleaning Group</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          </section>
        </div>

        <Button type="submit" variant={"default"}>
          Add schedule
        </Button>
      </form>
    </Form>
  );
}
