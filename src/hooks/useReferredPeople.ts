import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ReferredPerson {
  firstName: string | null;
  surname: string | null;
  name: string | null;
  joinedAt: string;
}

export interface ReferredPeopleResult {
  people: ReferredPerson[];
  count: number;
  loading: boolean;
  refresh: () => void;
}

/**
 * List of people who signed up through the current participant's invite link.
 * Reads through the get_my_referred_people security-definer RPC, which resolves
 * the caller from auth.uid() and never exposes email or user ids.
 */
export const useReferredPeople = (): ReferredPeopleResult => {
  const { user } = useAuth();
  const [people, setPeople] = useState<ReferredPerson[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setPeople([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc("get_my_referred_people");
      if (error) {
        setPeople([]);
      } else {
        setPeople(
          ((data ?? []) as Array<{
            first_name: string | null;
            surname: string | null;
            name: string | null;
            created_at: string;
          }>).map((r) => ({
            firstName: r.first_name ?? null,
            surname: r.surname ?? null,
            name: r.name ?? null,
            joinedAt: r.created_at,
          }))
        );
      }
    } catch {
      setPeople([]);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    people,
    count: people.length,
    loading,
    refresh: () => void load(),
  };
};

export default useReferredPeople;
