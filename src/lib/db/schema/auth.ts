import { z } from "zod";

/** Only the local display name may be changed; Google manages identity. */
export const updateUserParams = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Please enter your name."),
});

export type UpdateUserParams = z.infer<typeof updateUserParams>;
