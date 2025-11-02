import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Calendar, Info, Loader2, UsersRound } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import Snowfall from "react-snowfall";
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
import {
  useChristmasAddGuest,
  useChristmasGuestCount,
} from "~/hooks/useChristmas";
import {
  delta,
  isMoreThanTwoWeekApart as isMoreThanTwoWeeksApart,
} from "~/lib/utils";

const phoneNumberRegEx = /^\+?[1-9]\d{1,14}$/;
export const addGuestSchema = z.object({
  eventId: z.number().min(1, "An event id must be provided."),
  names: z.string().min(2, {
    message: "Guest name must be at least 2 characters.",
  }),
  phoneNumber: z
    .string()
    .regex(
      phoneNumberRegEx,
      "Invalid phone number format. Must start with + followed by 1-14 digits."
    )
    .transform((val) => (val.startsWith("+") ? val.slice(1) : val)),
  dietary: z.string().max(255).optional(),
  nRsvp: z.number().min(1).default(1),
});

const MAX_GUESTS = 70;
const eventDate = new Date("2025-12-20T15:00:00Z");
export default function ChristmasPage() {
  const form = useForm<z.infer<typeof addGuestSchema>>({
    resolver: zodResolver(addGuestSchema),
    defaultValues: { eventId: 31 },
  });

  const { addGuest: execute } = useChristmasAddGuest();

  async function onSubmit(values: z.infer<typeof addGuestSchema>) {
    await execute(values);
  }

  /** local state for agreement. */
  const [agree, setAgree] = React.useState<boolean>(false);

  /** state to track available seats. */
  const { totalGuests, isLoading } = useChristmasGuestCount();
  const isPending = false;
  const spotLeft = Math.max(MAX_GUESTS - (totalGuests ?? 0), 0);

  return (
    <Template title="Christmas Event">
      <div className="relative flex items-center justify-center bg-dark-grey-default/40 backdrop-blur-sm">
        {agree ? null : (
          <div className="fixed inset-0 top-10 mx-auto grid h-12 w-10/12 grid-cols-2 items-center justify-center gap-x-1 rounded-mdtext-white-primary-default lg:w-1/2">
            <div className="col-span-1 flex h-9 justify-center gap-x-1 rounded-sm bg-white/20 px-2 py-2">
              {delta(eventDate) === 0 ? (
                <div className="flex items-center gap-x-1">
                  <Calendar className="h-4 w-4" />
                  <p className="mb-1 text-sm">Registration closed</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-x-1">
                    <Calendar className="h-4 w-4" />
                    <p className="text-sm">{delta(eventDate)} days left</p>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-1 flex h-9 justify-center gap-x-1 rounded-sm bg-white/20 px-2 py-2 text-center">
              {isLoading ? (
                <div className="flex items-center gap-x-1">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="animate-pulse text-sm">
                    Loading available seats ...
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-x-1">
                  <UsersRound className="h-4 w-4" />
                  <p className="text-sm">
                    {spotLeft === 0 ? "No" : spotLeft} spots left
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <Snowfall radius={[0, 2.5]} snowflakeCount={100} speed={[1.0, 2.0]} />

        {agree ? (
          <div className="mt-8 grid">
            <div className="mb-4">
              <Button onClick={() => setAgree(false)} size={"icon"}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>

            <Form {...form}>
              <form
                className="flex max-w-[500x] flex-col space-y-4"
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
                    <FormItem>
                      <FormLabel>Nomer Whatsapp</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="491234567899" />
                      </FormControl>
                      <FormDescription className="text-white-primary-default/80">
                        Please input a valid whatsapp number. The number will be
                        used for automated RSVP via WhatsApp.
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

                {isPending ? (
                  <Button className="flex w-full items-center gap-2 bg-white/20">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm">Registering ...</p>
                  </Button>
                ) : (
                  <Button className="mt-8 bg-white/20" type="submit">
                    Submit
                  </Button>
                )}
              </form>
            </Form>
          </div>
        ) : (
          <div className="mt-28 lg:w-1/2">
            <div className="grid gap-y-4">
              <p>Shalom Saudara/i,</p>
              <p>
                Acara natal PERKI Aachen akan diadakan pada tanggal{" "}
                <span className="font-bold">20.12.2025</span> pukul{" "}
                <span className="font-bold">15:00</span>. Ada beberapa informasi
                yang wajib Saudara/i ketahui:
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
                <span className="font-bold">(20.12.2025)</span> atau ketika
                pendaftar sudah mencapai 70 orang. Oleh karena itu, kami mohon
                Saudara/i dapat mendaftarkan diri secepat mungkin dan tidak
                mendaftar dekat dengan deadline yang ada.
              </p>
              <p>
                3. Bagi Saudara/i yang ingin hadir bersama keluarga, diharapkan
                untuk mendaftarkan seluruh anggota keluarga yang akan hadir satu
                per satu guna memastikan jumlah konsumsi.
              </p>
              <p>
                4. Akan diadakan acara tukar kado natal. Saudara/i yang datang
                ke gereja diharapkan dapat mempersiapkan kado natal dengan
                budget +- 5 Euro.{" "}
                <span className="font-bold">
                  Mohon jangan memberikan makanan/minuman
                </span>
                . Diharapkan untuk membungkus kado dan memberikan tulisan (dalam
                bentuk surat kecil) tentang ayat alkitab yang paling berkesan
                bagi Saudara/i di tahun ini dan alasan mengapa ayat tersebut
                berkesan.
              </p>
              <p>
                Diharapkan Jemaat tidak terlambat untuk datang ke dalam ibadah.
              </p>

              <div className="flex w-full items-center gap-x-4 rounded-md bg-neutral-200/20 p-4">
                <Info className="w-12" />
                <p className="text-sm">
                  Untuk bantuan dan informasi lebih lanjut, silahkan hubungi
                  +491745277265{" "}
                  <span className="font-bold">(Reggy Irawan)</span> via
                  WhatsApp.{" "}
                </p>
              </div>

              <p className="mt-4 text-right font-bold">
                See you and God bless you! :)
              </p>
            </div>

            <div className="mt-12 flex justify-center">
              {isMoreThanTwoWeeksApart(new Date("2025-12-20")) ||
              totalGuests === MAX_GUESTS ? (
                <Button className="bg-white/20 font-bold">
                  Registration closed!
                </Button>
              ) : (
                <Button
                  className="bg-white/20 font-bold"
                  onClick={() => setAgree(true)}
                >
                  Sign me up! 🎄
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Template>
  );
}
