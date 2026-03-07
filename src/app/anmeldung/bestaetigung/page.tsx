import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Reservierung bestaetigt",
};

interface Props {
  searchParams: Promise<{ id?: string }>;
}

export default async function BestaetigungPage({ searchParams }: Props) {
  const { id } = await searchParams;

  if (!id) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-muted-foreground">Keine Reservierungs-ID angegeben.</p>
      </div>
    );
  }

  const supabase = createAdminClient();

  const { data: reservation } = await supabase
    .from("reservations")
    .select(`
      *,
      houses!inner (
        house_number,
        label,
        house_types!inner (name)
      ),
      events!inner (
        title,
        bank_account_holder,
        bank_iban,
        bank_bic
      )
    `)
    .eq("id", id)
    .single();

  if (!reservation) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-muted-foreground">Reservierung nicht gefunden.</p>
      </div>
    );
  }

  const house = reservation.houses as { house_number: number; label: string; house_types: { name: string } };
  const event = reservation.events as { title: string; bank_account_holder: string; bank_iban: string; bank_bic: string | null };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
          <h1 className="mt-4 text-3xl font-bold">Reservierung erfolgreich!</h1>
          <p className="mt-2 text-muted-foreground">
            Ihre Reservierung wurde erstellt. Bitte ueberweisen Sie den Betrag
            innerhalb von 14 Tagen.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold">Reservierungsdetails</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unterkunft</span>
                <span>{house.house_types.name} - {house.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kontaktperson</span>
                <span>
                  {reservation.contact_first_name} {reservation.contact_last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Betrag</span>
                <span className="font-semibold">
                  {formatCurrency(reservation.total_price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gueltig bis</span>
                <span>{formatDateShort(reservation.expires_at)}</span>
              </div>
            </div>

            <Separator className="my-4" />

            <h2 className="font-semibold">Ueberweisungsdaten</h2>
            <div className="mt-4 space-y-2 rounded-md bg-muted p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Empfaenger</span>
                <span>{event.bank_account_holder}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IBAN</span>
                <span className="font-mono">{event.bank_iban}</span>
              </div>
              {event.bank_bic && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">BIC</span>
                  <span className="font-mono">{event.bank_bic}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verwendungszweck</span>
                <span className="font-mono font-semibold">
                  {reservation.payment_reference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Betrag</span>
                <span className="font-semibold">
                  {formatCurrency(reservation.total_price)}
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Bitte geben Sie unbedingt den Verwendungszweck an, damit wir Ihre
              Zahlung zuordnen koennen. Nach Zahlungseingang erhalten Sie eine
              Bestaetigungs-E-Mail.
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Zurueck zur Startseite
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
