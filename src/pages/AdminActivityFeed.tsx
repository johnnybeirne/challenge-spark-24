import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Plus, Trash2, Save, GripVertical } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Spinner from "@/components/Spinner";
import { toast } from "sonner";

const ADMIN_PASSWORD = "challengeos2024";

interface FeedItem {
  id: string;
  name: string;
  action: string;
  time_label: string;
  icon_type: string;
  avatar_url: string | null;
  is_active: boolean;
  sort_order: number;
}

const AdminActivityFeed = () => {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [editItem, setEditItem] = useState<Partial<FeedItem> | null>(null);

  const login = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      loadData();
    } else {
      toast.error("Invalid password");
    }
  };

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("activity_feed_items")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      toast.error("Failed to load feed items");
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const saveItem = async (item: FeedItem) => {
    const { error } = await supabase
      .from("activity_feed_items")
      .update({
        name: item.name,
        action: item.action,
        time_label: item.time_label,
        icon_type: item.icon_type,
        avatar_url: item.avatar_url,
        is_active: item.is_active,
        sort_order: item.sort_order,
      })
      .eq("id", item.id);
    if (error) {
      toast.error("Failed to save");
    } else {
      toast.success("Saved");
      loadData();
    }
  };

  const addItem = async () => {
    const { error } = await supabase.from("activity_feed_items").insert({
      name: "New User",
      action: "joined the challenge",
      time_label: "just now",
      icon_type: "zap",
      sort_order: items.length + 1,
    });
    if (error) {
      toast.error("Failed to add item");
    } else {
      toast.success("Item added");
      loadData();
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("activity_feed_items").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Deleted");
      loadData();
    }
  };

  const updateField = (id: string, field: keyof FeedItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 text-foreground">
              <Lock className="h-5 w-5" />
              <h2 className="font-semibold text-lg">Admin — Activity Feed</h2>
            </div>
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
            />
            <Button onClick={login} className="w-full">
              Unlock
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Activity Feed Manager</h1>
        <Button onClick={addItem} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className="border border-border">
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <Input
                    value={item.name}
                    onChange={(e) => updateField(item.id, "name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Action</label>
                  <Input
                    value={item.action}
                    onChange={(e) => updateField(item.id, "action", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Time Label</label>
                  <Input
                    value={item.time_label}
                    onChange={(e) => updateField(item.id, "time_label", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Icon</label>
                  <Select
                    value={item.icon_type}
                    onValueChange={(v) => updateField(item.id, "icon_type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zap">⚡ Zap</SelectItem>
                      <SelectItem value="rocket">🚀 Rocket</SelectItem>
                      <SelectItem value="users">👥 Users</SelectItem>
                      <SelectItem value="heart">❤️ Heart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Avatar URL</label>
                  <Input
                    value={item.avatar_url || ""}
                    onChange={(e) => updateField(item.id, "avatar_url", e.target.value)}
                    placeholder="/avatars/name.jpg"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Sort Order</label>
                  <Input
                    type="number"
                    value={item.sort_order}
                    onChange={(e) => updateField(item.id, "sort_order", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={(v) => updateField(item.id, "is_active", v)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.is_active ? "Active" : "Hidden"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => deleteItem(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <Button size="sm" onClick={() => saveItem(item)}>
                    <Save className="h-4 w-4 mr-1" /> Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminActivityFeed;
