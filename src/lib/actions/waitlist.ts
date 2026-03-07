"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod/v4";
import { redirect } from "next/navigation";

const waitlistSchema = z.object({
  event_id: z.string().uuid(),
  house_type_id: z.string().uuid(),
  contact_first_name: z.string().min(1),
  contact_last_name: z.string().min(1),
  contact_email: z.email(),
  contact_phone: z.string().optional(),
  guest_count: z.number().min(1).max(10),
});

export type WaitlistFormData = z.infer<typeof waitlistSchema>;

export async function joinWaitlist(formData: WaitlistFormData) {
  const parsed = waitlistSchema.safeParse(formData);

  if (!parsed.success) {
    return { error: "Ungueltige Eingaben." };
  }

  const data = parsed.data;
  const supabase = createAdminClient();

  // Naechste Position auf der Warteliste ermitteln
  const { data: maxPos } = await supabase
    .from("waitlist")
    .select("position")
    .eq("house_type_id", data.house_type_id)
    .eq("status", "wartend")
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const nextPosition = (maxPos?.position ?? 0) + 1;

  const { error } = await supabase.from("waitlist").insert({
    event_id: data.event_id,
    house_type_id: data.house_type_id,
    contact_first_name: data.contact_first_name,
    contact_last_name: data.contact_last_name,
    contact_email: data.contact_email,
    contact_phone: data.contact_phone ?? null,
    guest_count: data.guest_count,
    position: nextPosition,
  });

  if (error) {
    return { error: "Warteliste-Eintrag fehlgeschlagen." };
  }

  redirect("/anmeldung/warteliste");
}
