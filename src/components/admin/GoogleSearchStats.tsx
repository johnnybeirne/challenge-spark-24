import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/Spinner";
import { supabase } from "@/integrations/supabase/client";

interface Row {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SearchStats {
  siteUrl: string;
  properties: string[];
  range: { startDate: string; endDate: string };
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  queries: Row[];
  pages: Row[];
  days: Row[];
  countries: Row[];
  devices: Row[];
  refreshedAt: string;
}

const isoDaysAgo = (n: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

const RowTable = ({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: Row[];
  emptyLabel: string;
}) => (
  <div>
    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
      {title}
    </h3>
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="p-3 font-medium">Term</th>
                <th className="p-3 font-medium text-right">Clicks</th>
                <th className="p-3 font-medium text-right">Impressions</th>
                <th className="p-3 font-medium text-right">CTR</th>
                <th className="p-3 font-medium text-right">Avg position</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.keys.join("|")} className="border-t border-border">
                  <td className="p-3 break-all max-w-[420px]">{r.keys.join(" ")}</td>
                  <td className="p-3 text-right">{r.clicks}</td>
                  <td className="p-3 text-right">{r.impressions}</td>
                  <td className="p-3 text-right">{pct(r.ctr)}</td>
                  <td className="p-3 text-right">{r.position.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  </div>
);

interface Props {
  fromDate?: string;
  toDate?: string;
}

const GoogleSearchStats = ({ fromDate, toDate }: Props) => {
  const [data, setData] = useState<SearchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: fnError } = await supabase.functions.invoke("google-search-stats", {
        body: {
          startDate: fromDate || isoDaysAgo(28),
          endDate: toDate || isoDaysAgo(1),
        },
      });
      if (fnError) throw fnError;
      if ((res as { error?: string })?.error) throw new Error((res as { error: string }).error);
      setData(res as SearchStats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load Google Search data");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          <p className="text-sm text-foreground">
            Google Search data is not available right now.
          </p>
          <p className="text-xs text-muted-foreground break-words">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const noData = data.totals.impressions === 0 && data.totals.clicks === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Google Search property {data.siteUrl} · {data.range.startDate} to {data.range.endDate}
        </p>
        <Button variant="outline" size="sm" onClick={load}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{data.totals.clicks}</p>
            <p className="text-xs text-muted-foreground">Clicks from Google</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{data.totals.impressions}</p>
            <p className="text-xs text-muted-foreground">Times shown in search</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{pct(data.totals.ctr)}</p>
            <p className="text-xs text-muted-foreground">Click rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {data.totals.position ? data.totals.position.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Average position</p>
          </CardContent>
        </Card>
      </div>

      {noData && (
        <p className="text-sm text-muted-foreground">
          Google has reported no search activity for this period yet. New pages can take a few weeks
          to appear.
        </p>
      )}

      <RowTable
        title="Top search terms"
        rows={data.queries}
        emptyLabel="No search terms reported for this period."
      />
      <RowTable
        title="Top pages in Google"
        rows={data.pages}
        emptyLabel="No pages reported for this period."
      />
      <div className="grid md:grid-cols-2 gap-6">
        <RowTable
          title="Countries"
          rows={data.countries}
          emptyLabel="No country data for this period."
        />
        <RowTable
          title="Devices"
          rows={data.devices}
          emptyLabel="No device data for this period."
        />
      </div>
    </div>
  );
};

export default GoogleSearchStats;
