import { useEffect, useState } from "react";
import {
  AppNotification,
  getNotifications,
  subscribeNotifications,
} from "@/lib/notifications";

export function useNotifications(): AppNotification[] {
  const [items, setItems] = useState<AppNotification[]>(() => getNotifications());
  useEffect(() => subscribeNotifications(setItems), []);
  return items;
}
