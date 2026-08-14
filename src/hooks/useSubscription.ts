import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getStripeEnvironment } from "@/lib/stripe";

export interface SubscriptionRow {
  id: string;
  status: string;
  price_id: string;
  product_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string;
}

export interface SubscriptionState {
  subscription: SubscriptionRow | null;
  /** true while a paid plan is current (includes cancelled-but-not-expired) */
  isSubscribed: boolean;
  /** payment retrying — keep access, but show a billing reminder */
  isPastDue: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const isCurrent = (row: SubscriptionRow | null): boolean => {
  if (!row) return false;
  const endsAt = row.current_period_end ? new Date(row.current_period_end).getTime() : null;
  const stillInPeriod = endsAt === null || endsAt > Date.now();
  if (["active", "trialing", "past_due"].includes(row.status)) return stillInPeriod;
  // Cancelled plans keep access until the paid period runs out.
  if (row.status === "canceled") return endsAt !== null && endsAt > Date.now();
  return false;
};

export const useSubscription = (): SubscriptionState => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions")
      .select(
        "id, status, price_id, product_id, current_period_end, cancel_at_period_end, stripe_customer_id",
      )
      .eq("user_id", user.id)
      .eq("environment", getStripeEnvironment())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription((data as SubscriptionRow | null) ?? null);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Keep the UI in step with webhook writes without a page refresh.
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!user?.id) return;
    // Unique topic per hook instance: two components mounting the same topic
    // name makes supabase-js reuse (and re-subscribe to) one channel, which
    // throws "cannot add postgres_changes callbacks after subscribe()".
    const topic = `subscriptions-${user.id}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => {
          void loadRef.current();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);


  return {
    subscription,
    isSubscribed: isCurrent(subscription),
    isPastDue: subscription?.status === "past_due",
    loading,
    refresh: load,
  };
};

export default useSubscription;
