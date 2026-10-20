"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Calendar, Info, Loader2, TreePine } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Template from "~/components/template";
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
import { Input } from "~/components/ui/input";
import { PhoneInput } from "~/components/ui/phone-input";
import {
  useChristmasAddGuest,
  useChristmasGuestCount,
} from "~/hooks/use-christmas";
import { delta, isMoreThanOneWeekApart, toIdDate, toIdTime } from "~/lib/utils";

const phoneNumberRegEx = /^\+?[1-9]\d{1,14}$/;
export const addGuestSchema = z.object({
  dietary: z.string().max(255).optional(),
  eventId: z.number().min(1, "An event id must be provided."),
  names: z.string().min(2, {
    message: "Guest name must be at least 2 characters.",
  }),
  nRsvp: z.number().min(1),
  phoneNumber: z
    .string()
    .regex(
      phoneNumberRegEx,
      "Invalid phone number format. Must start with + followed by 1-14 digits."
    )
    .transform((val) => (val.startsWith("+") ? val.slice(1) : val)),
});

const MAX_GUESTS = 80;
const eventDate = new Date("2025-12-20T15:00:00+01:00");
export default function ChristmasPage() {
  const form = useForm<z.infer<typeof addGuestSchema>>({
    defaultValues: { eventId: 31, nRsvp: 1 },
    resolver: zodResolver(addGuestSchema),
  });

  const { addGuest } = useChristmasAddGuest();

  function onSubmit(values: z.infer<typeof addGuestSchema>) {
    addGuest.mutate(values);
  }

  /** local state for agreement. */
  const [agree, setAgree] = React.useState<boolean>(false);

  /** state to track available seats. */
  const { totalGuests } = useChristmasGuestCount();

  return (
    <Template title="Christmas Event">
      <div className="flex flex-col gap-6">
        {agree ? null : (
          <div className="rounded-xl bg-card p-4">
            <div className="flex items-center gap-2">
              {delta(eventDate) === 0 ? (
                <div className="flex items-center gap-x-1">
                  <Calendar className="h-4 w-4" />
                  <p className="type-body-sm mb-1">Registration closed</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-x-1">
                    <Calendar className="h-4 w-4" />
                    <p className="type-body-sm">{delta(eventDate)} days left</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {agree ? (
          <div className="grid">
            <div className="mb-4">
              <Button
                aria-label="Back to event details"
                onClick={() => setAgree(false)}
                size="icon"
                type="button"
                variant="secondary"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>

            <Form {...form}>
              <form
                className="flex w-full flex-col gap-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="names"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Max Mustermann" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-start">
                      <FormLabel>Whatsapp Number</FormLabel>
                      <FormControl className="w-full">
                        <PhoneInput
                          placeholder="Placeholder"
                          {...field}
                          defaultCountry="DE"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter your valid whatsapp number.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dietary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alergi makanan</FormLabel>
                      <FormControl>
                        <Input placeholder="-" {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                {addGuest.isPending ? (
                  <Button className="w-full" disabled type="submit">
                    <Loader2
                      aria-hidden="true"
                      className="motion-safe:animate-spin"
                    />
                    <p className="type-body-sm">Registering ...</p>
                  </Button>
                ) : (
                  <Button className="mt-8" type="submit">
                    Submit
                  </Button>
                )}
              </form>
            </Form>
          </div>
        ) : (
          <div lang="id">
            <div className="grid gap-y-4">
              <p>Shalom Saudara/i,</p>
              <p>
                Acara natal PERKI Aachen akan diadakan pada tanggal{" "}
                <span className="font-bold">{toIdDate(eventDate)}</span> pukul{" "}
                <span className="font-bold">{toIdTime(eventDate)}</span>. Ada
                beberapa informasi yang wajib Saudara/i ketahui:
              </p>
              <p>
                1. Alamat gereja adalah{" "}
                <span className="font-bold">
                  Roermonderstraße 110a, 52072 Aachen
                </span>
                . Demi kelancaran ibadah, Saudara/i mohon hadir di gereja jam
                <span className="font-bold"> 14.30</span>.
              </p>
              <p>
                2. Karena keterbatasan kapasitas gedung dan untuk membantu
                teman-teman pengurus konsumsi, maka pendaftaran akan ditutup 1
                minggu sebelum ibadah{" "}
                <span className="font-bold">
                  (
                  {toIdDate(
                    DateTime.fromJSDate(eventDate)
                      .minus({ weeks: 1 })
                      .toJSDate()
                  )}
                  )
                </span>
                . Oleh karena itu, kami mohon Saudara/i dapat mendaftarkan diri
                secepat mungkin dan tidak mendaftar dekat dengan deadline yang
                ada.
              </p>
              <p>
                3. Bagi Saudara/i yang ingin hadir bersama keluarga, diharapkan
                untuk mendaftarkan seluruh anggota keluarga yang akan hadir satu
                per satu guna memastikan jumlah konsumsi.
              </p>
              <p>
                4. Akan diadakan acara tukar kado natal. Saudara/i yang datang
                ke gereja diharapkan dapat mempersiapkan kado natal dengan
                budget ± 5 Euro.{" "}
                <span className="font-bold">
                  Mohon jangan memberikan makanan/minuman
                </span>
                . Diharapkan untuk membungkus kado dan memberikan tulisan
                (dalam± bentuk surat kecil) tentang ayat alkitab yang paling
                berkesan bagi Saudara/i di tahun ini dan alasan mengapa ayat
                tersebut berkesan.
              </p>
              <p>
                Diharapkan Jemaat tidak terlambat untuk datang ke dalam ibadah.
              </p>

              <div className="flex w-full items-start gap-3 rounded-xl bg-card p-4 sm:p-6">
                <Info className="w-8" />
                <div className="">
                  <p className="type-body-sm">
                    Untuk bantuan dan informasi lebih lanjut, silahkan hubungi{" "}
                    <Link
                      className="font-bold underline"
                      href="https://wa.me/491788710951"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Victor Jordan
                    </Link>
                    .
                  </p>

                  {totalGuests >= MAX_GUESTS && (
                    <p className="type-body-sm mt-3 text-foreground">
                      Karena kapasitas orang yang sudah mendaftar lebih dari
                      kapasitas maksimal konsumsi, Anda tetap bisa mendaftar dan
                      mengikuti ibadah, namun kita tidak menjamin ketersediaan
                      konsumsi.
                    </p>
                  )}
                </div>
              </div>

              <p className="mt-4 text-right font-bold">
                See you and God bless you! :)
              </p>
            </div>

            <div className="mt-12 flex justify-center">
              {isMoreThanOneWeekApart(new Date("2025-12-20T23:59:00+01:00")) ? (
                <Button disabled type="button" variant="secondary">
                  Registration closed!
                </Button>
              ) : (
                <Button onClick={() => setAgree(true)} type="button">
                  <TreePine className="size-4" /> Sign me up!
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Template>
  );
}
