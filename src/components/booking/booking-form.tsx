"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import { HouseTypeCard } from "./house-type-card";
import { createReservation } from "@/lib/actions/booking";
import { formatCurrency } from "@/lib/utils/format";
import type { HouseType, Availability } from "@/lib/types/database";
import type { GuestData } from "@/lib/validations/booking";

interface BookingFormProps {
  eventId: string;
  houseTypes: HouseType[];
  availability: Availability[];
}

const emptyGuest: GuestData = {
  first_name: "",
  last_name: "",
  birth_date: "",
  is_child: false,
  dietary_notes: "",
  sort_order: 0,
};

export function BookingForm({ eventId, houseTypes, availability }: BookingFormProps) {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [guests, setGuests] = useState<GuestData[]>([{ ...emptyGuest }]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedType = houseTypes.find((ht) => ht.id === selectedTypeId);
  const selectedAvailability = availability.find(
    (a) => a.house_type_id === selectedTypeId
  );

  function addGuest() {
    if (selectedType && guests.length >= selectedType.max_guests) return;
    setGuests((prev) => [
      ...prev,
      { ...emptyGuest, sort_order: prev.length },
    ]);
  }

  function removeGuest(index: number) {
    if (guests.length <= 1) return;
    setGuests((prev) => prev.filter((_, i) => i !== index));
  }

  function updateGuest(index: number, field: keyof GuestData, value: string | boolean) {
    setGuests((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: value } : g))
    );
  }

  async function handleSubmit(formData: FormData) {
    setError(null);

    if (!selectedTypeId) {
      setError("Bitte waehlen Sie einen Haustyp aus.");
      return;
    }

    const data = {
      event_id: eventId,
      house_type_id: selectedTypeId,
      contact_first_name: formData.get("contact_first_name") as string,
      contact_last_name: formData.get("contact_last_name") as string,
      contact_email: formData.get("contact_email") as string,
      contact_phone: (formData.get("contact_phone") as string) || undefined,
      guests: guests.map((g, i) => ({ ...g, sort_order: i })),
    };

    startTransition(async () => {
      const result = await createReservation(data);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Schritt 1: Haustyp waehlen */}
      <section>
        <h2 className="text-xl font-semibold">1. Unterkunft waehlen</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Waehlen Sie Ihren gewuenschten Unterkunftstyp aus.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {houseTypes.map((ht) => {
            const avail = availability.find(
              (a) => a.house_type_id === ht.id
            );
            return (
              <HouseTypeCard
                key={ht.id}
                houseType={ht}
                availableCount={avail?.available_count ?? 0}
                isSelected={selectedTypeId === ht.id}
                onSelect={() => setSelectedTypeId(ht.id)}
              />
            );
          })}
        </div>
      </section>

      {/* Schritt 2 + 3: Formular (nur wenn Typ gewaehlt) */}
      {selectedType && selectedAvailability && selectedAvailability.available_count > 0 && (
        <form action={handleSubmit}>
          {/* Schritt 2: Kontaktdaten */}
          <section>
            <h2 className="text-xl font-semibold">2. Kontaktdaten</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Die Kontaktperson erhaelt die Reservierungsbestaetigung per E-Mail.
            </p>
            <Card className="mt-4">
              <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="contact_first_name">Vorname *</Label>
                  <Input
                    id="contact_first_name"
                    name="contact_first_name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_last_name">Nachname *</Label>
                  <Input
                    id="contact_last_name"
                    name="contact_last_name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">E-Mail *</Label>
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Telefon</Label>
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    type="tel"
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator className="my-8" />

          {/* Schritt 3: Gaeste */}
          <section>
            <h2 className="text-xl font-semibold">3. Gaeste eintragen</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tragen Sie alle Personen ein, die im {selectedType.name} uebernachten
              (max. {selectedType.max_guests} Personen).
            </p>

            <div className="mt-4 space-y-4">
              {guests.map((guest, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        Gast {index + 1}
                      </CardTitle>
                      {guests.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeGuest(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Vorname *</Label>
                      <Input
                        value={guest.first_name}
                        onChange={(e) =>
                          updateGuest(index, "first_name", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Nachname *</Label>
                      <Input
                        value={guest.last_name}
                        onChange={(e) =>
                          updateGuest(index, "last_name", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Geburtsdatum</Label>
                      <Input
                        type="date"
                        value={guest.birth_date ?? ""}
                        onChange={(e) =>
                          updateGuest(index, "birth_date", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2 self-end pb-1">
                      <input
                        type="checkbox"
                        id={`is_child_${index}`}
                        checked={guest.is_child}
                        onChange={(e) =>
                          updateGuest(index, "is_child", e.target.checked)
                        }
                        className="h-4 w-4 rounded border-input"
                      />
                      <Label htmlFor={`is_child_${index}`} className="text-sm font-normal">
                        Kind (unter 14 Jahre)
                      </Label>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Ernaehrungshinweise / Allergien</Label>
                      <Textarea
                        value={guest.dietary_notes ?? ""}
                        onChange={(e) =>
                          updateGuest(index, "dietary_notes", e.target.value)
                        }
                        placeholder="z.B. vegetarisch, Laktoseintoleranz..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {guests.length < selectedType.max_guests && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={addGuest}
                >
                  <Plus className="h-4 w-4" />
                  Weiteren Gast hinzufuegen
                </Button>
              )}
            </div>
          </section>

          <Separator className="my-8" />

          {/* Zusammenfassung */}
          <section>
            <h2 className="text-xl font-semibold">Zusammenfassung</h2>
            <Card className="mt-4">
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unterkunft</span>
                    <span className="font-medium">{selectedType.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Anzahl Gaeste</span>
                    <span className="font-medium">{guests.length}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-semibold">
                    <span>Gesamtpreis</span>
                    <span>{formatCurrency(selectedType.price_per_house)}</span>
                  </div>
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                  Mit der Reservierung erhalten Sie eine Bestaetigung per E-Mail
                  mit den Ueberweisungsdaten. Die Reservierung ist 14 Tage
                  gueltig. Nach Zahlungseingang wird Ihre Buchung bestaetigt.
                </p>
              </CardContent>
            </Card>
          </section>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6">
            <Button type="submit" size="lg" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reservierung wird erstellt...
                </>
              ) : (
                "Verbindlich reservieren"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
