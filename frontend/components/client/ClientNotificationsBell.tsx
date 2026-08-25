"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchNotifications } from "@/lib/clientApi";

export function ClientNotificationsBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        const items = await fetchNotifications(true);
        setUnread(items.length);
      } catch {
        setUnread(0);
      }
    })();
  }, []);

  if (unread === 0) return null;

  return (
    <Link href="/dashboard/informes" className="cp-topbar__notify" title="Notificaciones">
      {unread} nueva{unread === 1 ? "" : "s"}
    </Link>
  );
}
