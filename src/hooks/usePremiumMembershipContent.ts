import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PremiumMembershipContent = {
  id?: string;
  heading: string;
  description: string;
  asterisk_note: string;
};

export const PREMIUM_MEMBERSHIP_DEFAULTS: PremiumMembershipContent = {
  heading: "LeadTree Premium Membership",
  description:
    "24/7 access to Training, engage with the LeadTree Community, and attend Live Events with recordings.",
  asterisk_note:
    "*Invite 5 people who sign up for the challenge each month. Your cycle runs for 28 days from your signup date.",
};

export const usePremiumMembershipContent = () => {
  const [content, setContent] = useState<PremiumMembershipContent>(PREMIUM_MEMBERSHIP_DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("premium_membership_content")
        .select("id, heading, description, asterisk_note")
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (!error && data) {
        setContent({
          id: data.id,
          heading: data.heading ?? PREMIUM_MEMBERSHIP_DEFAULTS.heading,
          description: data.description ?? PREMIUM_MEMBERSHIP_DEFAULTS.description,
          asterisk_note: data.asterisk_note ?? PREMIUM_MEMBERSHIP_DEFAULTS.asterisk_note,
        });
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { content, setContent, loading };
};
