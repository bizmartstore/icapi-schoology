import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { compressToSectionCoverDataUrl } from "@/lib/section-image";

type Props = {
  label?: string;
  value: string;
  onChange: (dataUrl: string) => void;
  optional?: boolean;
};

const SectionCoverUploadField = ({
  label = "Section cover image",
  value,
  onChange,
  optional = true,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (f: File) => {
    setUploading(true);
    try {
      const dataUrl = await compressToSectionCoverDataUrl(f);
      onChange(dataUrl);
      toast.success("Cover image saved (compressed)");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not process image");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {!optional && " *"}
      </Label>
      <p className="text-[10px] text-muted-foreground">
        Stored as compressed code in the database — does not use file storage quota.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <img src={value} alt="Section cover preview" className="w-full h-32 object-cover" loading="lazy" />
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-7 w-7 rounded-full"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-7 w-7 rounded-full"
              onClick={() => onChange("")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) void handleFile(f);
          }}
          className="w-full border-2 border-dashed border-border rounded-xl py-6 flex flex-col items-center gap-1.5 hover:border-primary/50 transition-colors disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
          <span className="text-xs font-semibold text-foreground">
            {uploading ? "Compressing…" : "Tap or drop cover image"}
          </span>
        </button>
      )}
    </div>
  );
};

export default SectionCoverUploadField;
