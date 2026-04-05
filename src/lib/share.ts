import { toast } from "sonner";

interface ShareOptions {
  text: string;
  url: string;
  title?: string;
}

export async function shareOrCopy({ text, url, title }: ShareOptions): Promise<void> {
  // Try native share first
  if (navigator.share) {
    try {
      await navigator.share({ title: title ?? "Challenge OS", text, url });
      return;
    } catch (err: any) {
      // User cancelled — silently ignore
      if (err?.name === "AbortError") return;
    }
  }

  // Fallback: copy link
  try {
    await navigator.clipboard.writeText(`${text}\n\n${url}`);
    toast.success("Link copied to clipboard!");
  } catch {
    toast.error("Could not copy link");
  }
}
