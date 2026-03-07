"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { bookingFormSchema, type BookingFormData } from "@/lib/validations/booking";
import { redirect } from "next/navigation";

export async function createReservation(formData: BookingFormData) {
  const parsed = bookingFormSchema.safeParse(formData);

  if (!parsed.success) {
    return { error: "Ungueltige Eingaben. Bitte ueberpruefen Sie Ihre Daten." };
  }

  const data = parsed.data;
  const supabase = createAdminClient();

  // Preis berechnen
  const { data: houseType } = await supabase
    .from("house_types")
    .select("price_per_house")
    .eq("id", data.house_type_id)
    .single();

  if (!houseType) {
    return { error: "Haustyp nicht gefunden." };
  }

  // Atomare Reservierung per Datenbank-Funktion
  const { data: result, error } = await supabase.rpc("create_reservation", {
    p_event_id: data.event_id,
    p_house_type_id: data.house_type_id,
    p_contact_first_name: data.contact_first_name,
    p_contact_last_name: data.contact_last_name,
    p_contact_email: data.contact_email,
    p_contact_phone: data.contact_phone ?? null,
    p_total_price: houseType.price_per_house,
    p_guests: data.guests,
  });

  if (error) {
    return { error: "Reservierung fehlgeschlagen. Bitte versuchen Sie es erneut." };
  }

  if (result?.error) {
    return { error: result.error };
  }

  redirect(`/anmeldung/bestaetigung?id=${result.id}`);
}
