"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchNotifications, markNotificationRead } from "@/lib/clientApi";
import type { ClientNotification } from "@/lib/clientTypes";
import { notificationHref } from "@/lib/webProjects/viewModel";

export function ClientNotificationsBell() {
  const [items, setItems] = useState<ClientNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const next = await fetchNotifications(true);
        setItems(next);
      } catch {
        setItems([]);
      }
    })();
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="cp-notify">
      <button
        type="button"
        className="cp-notify__toggle"
        aria-expanded={open}
        aria-controls="cp-notify-list"
        onClick={() => setOpen((value) => !value)}
      >
        {items.length} nueva{items.length === 1 ? "" : "s"}
      </button>
      {open ? (
        <ul id="cp-notify-list" className="cp-notify__list">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={notificationHref(item)}
                onClick={() => {
                  void markNotificationRead(item.id);
                }}
              >
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}