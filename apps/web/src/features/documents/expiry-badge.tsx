import { differenceInCalendarDays, format } from "date-fns";
import { CalendarClock } from "lucide-react";
import type { DocumentRecord } from "@lockerr/types";
import { Badge } from "@/components/ui/badge";

export function ExpiryBadge({
  document: doc,
  compact,
}: {
  document: DocumentRecord;
  compact?: boolean;
}) {
  if (!doc.expiryDate) return null;

  const days = differenceInCalendarDays(new Date(doc.expiryDate), new Date());
  const variant =
    days < 0 ? "destructive" : days <= 30 ? "warning" : "secondary";

  let label: string;
  if (days < 0) label = compact ? "Expired" : `Expired ${Math.abs(days)}d ago`;
  else if (days === 0) label = "Expires today";
  else if (days <= 30) label = compact ? `${days}d left` : `Expires in ${days}d`;
  else label = compact ? format(new Date(doc.expiryDate), "MMM d") : `Expires ${format(new Date(doc.expiryDate), "MMM d, yyyy")}`;

  return (
    <Badge variant={variant} className="gap-1">
      <CalendarClock className="h-3 w-3" />
      {label}
    </Badge>
  );
}
