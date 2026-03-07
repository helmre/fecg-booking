import { getHouseOccupancy, getActiveEventAdmin } from "@/lib/queries/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, User, CheckCircle } from "lucide-react";

export default async function HaeuserPage() {
  const event = await getActiveEventAdmin();
  if (!event) return <p>Kein aktives Event.</p>;

  const occupancy = await getHouseOccupancy(event.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hausbelegung</h1>

      {occupancy.map((ht) => {
        const occupied = ht.houses.filter((h) => h.reservation).length;
        const total = ht.houses.length;

        return (
          <Card key={ht.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{ht.name}</CardTitle>
                <Badge variant={occupied === total ? "destructive" : "secondary"}>
                  {occupied}/{total} belegt
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {ht.houses.map((house) => (
                  <div
                    key={house.id}
                    className={`flex items-center gap-3 rounded-md border p-3 ${
                      house.reservation
                        ? house.reservation.payment_status === "eingegangen"
                          ? "border-green-200 bg-green-50"
                          : "border-amber-200 bg-amber-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <Home className={`h-5 w-5 ${
                      house.reservation
                        ? house.reservation.payment_status === "eingegangen"
                          ? "text-green-600"
                          : "text-amber-500"
                        : "text-gray-400"
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        Haus {house.house_number}
                      </p>
                      {house.reservation ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {house.reservation.contact_first_name}{" "}
                          {house.reservation.contact_last_name}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Frei</p>
                      )}
                    </div>
                    {house.reservation && (
                      house.reservation.payment_status === "eingegangen" ? (
                        <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                      ) : (
                        <User className="h-4 w-4 shrink-0 text-amber-500" />
                      )
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded border border-gray-200 bg-gray-50" />
          Frei
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded border border-amber-200 bg-amber-50" />
          Reserviert (unbezahlt)
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded border border-green-200 bg-green-50" />
          Bestaetigt (bezahlt)
        </span>
      </div>
    </div>
  );
}
