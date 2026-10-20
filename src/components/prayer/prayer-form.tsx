"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";

/** Mirrors `addPrayerSchema` on the server. */
export const PRAYER_MAX_LENGTH = 50;

const prayerFormSchema = z.object({
  content: z
    .string()
    .trim()
    .min(2, "Write at least two characters.")
    .max(PRAYER_MAX_LENGTH, `Keep it under ${PRAYER_MAX_LENGTH} characters.`),
  isAnonymous: z.boolean(),
});

export type PrayerFormValues = z.infer<typeof prayerFormSchema>;

/** Prayer request fields shared by the public wall and the admin dialogs. */
export default function PrayerForm({
  defaultValues = { content: "", isAnonymous: false },
  submitLabel,
  submitIcon,
  pending,
  onSubmit,
  secondaryAction,
  className,
}: {
  defaultValues?: PrayerFormValues;
  submitLabel: string;
  submitIcon?: ReactNode;
  pending: boolean;
  /** Resolve `true` to clear the form after a successful submit. */
  onSubmit: (values: PrayerFormValues) => Promise<boolean> | boolean;
  /** E.g. a Cancel button inside a dialog. */
  secondaryAction?: ReactNode;
  className?: string;
}) {
  const form = useForm<PrayerFormValues>({
    defaultValues,
    resolver: zodResolver(prayerFormSchema),
  });
  const length = form.watch("content")?.length ?? 0;
  const buttonLabel = pending ? "Saving…" : submitLabel;
  return (
    <Form {...form}>
      <form
        className={cn("flex flex-col gap-4", className)}
        onSubmit={form.handleSubmit(async (values) => {
          if (await onSubmit(values)) {
            form.reset({ content: "", isAnonymous: false });
          }
        })}
      >
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-baseline justify-between gap-3">
                <FormLabel>Prayer request</FormLabel>
                <span
                  className={cn(
                    "type-caption tabular-nums",
                    length > PRAYER_MAX_LENGTH
                      ? "text-destructive-text"
                      : "text-muted-foreground"
                  )}
                >
                  {length}/{PRAYER_MAX_LENGTH}
                </span>
              </div>
              <FormControl>
                <Textarea
                  className="min-h-20 resize-none"
                  placeholder="What can we pray for?"
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <FormField
            control={form.control}
            name="isAnonymous"
            render={({ field }) => (
              <FormItem className="flex items-start gap-3 space-y-0">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="flex flex-col gap-0.5">
                  <FormLabel className="type-body-sm">
                    Post anonymously
                  </FormLabel>
                  <FormDescription className="type-caption">
                    Your name won't be shown with the request.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          <div className="ml-auto flex gap-2">
            {secondaryAction}
            <Button disabled={pending} type="submit">
              {submitIcon}
              {buttonLabel}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
