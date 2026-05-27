import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

const STAGE_OPTIONS = [
  { value: "all", label: "All days" },
  { value: "pre", label: "Pre-challenge" },
  { value: "day1", label: "Day 1" },
  { value: "day2", label: "Day 2" },
  { value: "day3", label: "Day 3" },
  { value: "post", label: "Post-challenge" },
];

interface KbDoc {
  id: string;
  slug: string;
  title: string;
  content: string;
  source: string | null;
  stage: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const emptyDraft = (): Partial<KbDoc> => ({
  title: "",
  slug: "",
  content: "",
  source: "",
  stage: "all",
  tags: [],
  is_active: true,
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

// Read text-like files directly; PDF/DOCX via dynamic import
async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (
    file.type.startsWith("text/") ||
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".csv") ||
    name.endsWith(".markdown")
  ) {
    return await file.text();
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    return value;
  }
  if (name.endsWith(".pdf")) {
    const pdfjs: any = await import("pdfjs-dist");
    // Use a CDN worker so we don't need bundler config
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    const data = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data }).promise;
    let out = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      out += tc.items.map((it: any) => it.str).join(" ") + "\n\n";
    }
    return out.trim();
  }
  throw new Error(`Unsupported file type: ${file.name}`);
}

const AdminResourceLibrary = () => {
  const [docs, setDocs] = useState<KbDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all-stages");
  const [editing, setEditing] = useState<Partial<KbDoc> | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState<KbDoc | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<KbDoc | null>(null);
  const [dragging, setDragging] = useState(false);
  const [processingFiles, setProcessingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("kb_documents")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error(error.message);
    } else {
      setDocs((data as KbDoc[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    docs.forEach((d) => d.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [docs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((d) => {
      if (stageFilter !== "all-stages" && d.stage !== stageFilter) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.slug.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q) ||
        (d.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [docs, query, stageFilter]);

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setProcessingFiles(true);
    let imported = 0;
    for (const file of list) {
      try {
        const content = await extractFileText(file);
        if (!content.trim()) {
          toast.error(`${file.name}: no extractable text`);
          continue;
        }
        const title = file.name.replace(/\.[^.]+$/, "");
        const baseSlug = slugify(title) || `doc-${Date.now()}`;
        const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
        const { error } = await supabase.from("kb_documents").insert({
          title,
          slug,
          content,
          stage: "all",
          tags: [],
          source: file.name,
          is_active: true,
        } as any);
        if (error) throw error;
        imported += 1;
      } catch (err: any) {
        toast.error(`${file.name}: ${err.message || "failed"}`);
      }
    }
    setProcessingFiles(false);
    if (imported) {
      toast.success(`Imported ${imported} resource${imported === 1 ? "" : "s"}`);
      load();
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const saveDraft = async () => {
    if (!editing) return;
    if (!editing.title?.trim() || !editing.content?.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSaving(true);
    try {
      const tags = Array.isArray(editing.tags)
        ? editing.tags
        : String(editing.tags ?? "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
      const payload: any = {
        title: editing.title.trim(),
        slug: (editing.slug?.trim() || slugify(editing.title)) || `doc-${Date.now()}`,
        content: editing.content,
        source: editing.source?.trim() || null,
        stage: editing.stage || "all",
        tags,
        is_active: editing.is_active ?? true,
      };
      if (editing.id) {
        const { error } = await supabase
          .from("kb_documents")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Resource updated");
      } else {
        const { error } = await supabase.from("kb_documents").insert(payload);
        if (error) throw error;
        toast.success("Resource created");
      }
      setEditing(null);
      load();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase
      .from("kb_documents")
      .delete()
      .eq("id", confirmDelete.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Resource deleted");
      setDocs((prev) => prev.filter((d) => d.id !== confirmDelete.id));
    }
    setConfirmDelete(null);
  };

  const toggleActive = async (doc: KbDoc) => {
    const next = !doc.is_active;
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, is_active: next } : d)));
    const { error } = await supabase
      .from("kb_documents")
      .update({ is_active: next })
      .eq("id", doc.id);
    if (error) {
      toast.error(error.message);
      setDocs((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, is_active: !next } : d)),
      );
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resource Library</h1>
          <p className="text-sm text-muted-foreground">
            Upload, paste, and manage knowledge the AI Coach uses to guide challenge takers.
          </p>
        </div>
        <Button onClick={() => setEditing(emptyDraft())} className="gap-2">
          <Plus className="h-4 w-4" /> New resource
        </Button>
      </div>

      {/* Drop zone */}
      <Card
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          {processingFiles ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              Drop PDF, DOCX, TXT, Markdown, or CSV files here
            </p>
            <p className="text-xs text-muted-foreground">
              Text is extracted and added to the AI knowledge base
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,.markdown,.csv,text/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.currentTarget.value = "";
            }}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={processingFiles}
            >
              Choose files
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(emptyDraft())}
            >
              Paste text instead
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search title, content, tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-stages">All stages</SelectItem>
            {STAGE_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setQuery(t)}
            >
              #{t}
            </Badge>
          ))}
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <FileText className="h-8 w-8" />
              <p className="text-sm">No resources match your filters yet.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((d) => (
            <Card key={d.id} className={d.is_active ? "" : "opacity-60"}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-semibold">{d.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {STAGE_OPTIONS.find((s) => s.value === d.stage)?.label || d.stage}
                    </Badge>
                    {d.tags?.slice(0, 4).map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {d.content.slice(0, 200)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {d.source ? `Source: ${d.source} · ` : ""}Updated{" "}
                    {new Date(d.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 pr-2">
                    <Switch
                      checked={d.is_active}
                      onCheckedChange={() => toggleActive(d)}
                      aria-label="Active in AI context"
                    />
                    <span className="text-xs text-muted-foreground">
                      {d.is_active ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setPreviewing(d)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(d)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDelete(d)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Editor */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Edit resource" : "New resource"}
            </DialogTitle>
            <DialogDescription>
              Add knowledge the AI Coach can retrieve and cite when guiding users.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="kb-title">Title</Label>
                  <Input
                    id="kb-title"
                    value={editing.title ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        title: e.target.value,
                        slug: editing.id ? editing.slug : slugify(e.target.value),
                      })
                    }
                    placeholder="e.g. How to write a transformation hook"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kb-slug">Slug</Label>
                  <Input
                    id="kb-slug"
                    value={editing.slug ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, slug: slugify(e.target.value) })
                    }
                    placeholder="auto"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Stage</Label>
                  <Select
                    value={editing.stage || "all"}
                    onValueChange={(v) => setEditing({ ...editing, stage: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGE_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kb-tags">Tags (comma separated)</Label>
                  <Input
                    id="kb-tags"
                    value={
                      Array.isArray(editing.tags)
                        ? editing.tags.join(", ")
                        : (editing.tags as any) ?? ""
                    }
                    onChange={(e) =>
                      setEditing({ ...editing, tags: e.target.value as any })
                    }
                    placeholder="hooks, transformation, day1"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="kb-source">Source / attribution (optional)</Label>
                  <Input
                    id="kb-source"
                    value={editing.source ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, source: e.target.value })
                    }
                    placeholder="e.g. Leadio Blueprint v2"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kb-content">Content</Label>
                <Textarea
                  id="kb-content"
                  value={editing.content ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, content: e.target.value })
                  }
                  rows={14}
                  placeholder="Paste prompts, frameworks, training notes, examples, best practices…"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Markdown supported. This text is searchable by the AI Coach.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editing.is_active ?? true}
                  onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                />
                <Label>Active in AI context</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveDraft} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewing?.title}</DialogTitle>
            <DialogDescription>
              {previewing?.source ? `Source: ${previewing.source}` : "Preview"}
            </DialogDescription>
          </DialogHeader>
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
            {previewing?.content}
          </pre>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete resource?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.title}" will be removed from the AI knowledge base. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminResourceLibrary;
