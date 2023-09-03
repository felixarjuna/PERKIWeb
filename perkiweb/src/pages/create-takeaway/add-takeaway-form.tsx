"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { type z } from "zod";
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
import { Textarea } from "~/components/ui/textarea";
import { useToast } from "~/components/ui/use-toast";
import { speakers, takeawayIds } from "~/lib/data";
import { cn } from "~/lib/utils";
import { addTakeawaySchema } from "~/server/api/schema/schema";
import { api } from "~/utils/api";

export default function AddTakeawayForm() {
  const { toast } = useToast();
  const router = useRouter();

  const addTodo = api.takeaways.addTakeaway.useMutation({
    onSuccess: async () => {
      toast({
        title: "Your takeaway has been submitted! ✨",
        description: "Thanks for sharing!",
      });
      await router.push("/takeaway");
    },
  });

  // 1. Define form.
  const form = useForm<z.infer<typeof addTakeawaySchema>>({
    resolver: zodResolver(addTakeawaySchema),
    defaultValues: {
      // TODO: Automatically take contributors name from the username
      contributors: ["felixarjuna"],
    },
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof addTakeawaySchema>) {
    addTodo.mutate({ ...values });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="mt-8 space-y-8 xs:mt-4"
      >
        <div className="space-y-4">
          <h3 className="font-reimbrandt text-3xl xs:text-2xl">
            Fellowship Information
          </h3>
          <section className="grid grid-cols-2 gap-4 xs:text-sm">
            <div className="xs:col-span-2">
              <FormField
                control={form.control}
                name="takeawayId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-md">Fellowship Type</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fellowship type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {takeawayIds.map((id, index) => (
                            <SelectItem value={id} key={index}>
                              {id}
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

            <div className="xs:col-span-2">
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
            <div className="xs:col-span-2">
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
                        <PopoverContent className="w-auto p-1" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
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

            <div className="xs:col-span-2">
              <FormField
                control={form.control}
                name="speaker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-md">Speaker</FormLabel>
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
            <div className="xs:col-span-2">
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
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-md">Key points</FormLabel>
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

        <div className="flex justify-between">
          <Button type="submit" variant={"default"}>
            Add takeaway
          </Button>
          <Button className="flex gap-x-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </form>
    </Form>
  );
}
