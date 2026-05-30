import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Image as ImageIcon, Link2, Download, BookOpen, ArrowUpDown, Filter, FileType2 } from "lucide-react";

type Material = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  file_type: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
  section_subjects: {
    subjects: { name: string; grade_level: string | null; school_level: string | null; color: string | null } | null;
    sections: { name: string } | null;
  } | null;
};

type SortKey = "newest" | "oldest" | "title";

const formatSize = (bytes?: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const kindOf = (m: Material): "pdf" | "image" | "doc" | "link" => {
  const t = (m.file_type || "").toLowerCase();
  if (t.includes("pdf")) return "pdf";
  if (t.startsWith("image/")) return "image";
  if (m.url && !m.file_type) return "link";
  return "doc";
};

const ModulesShowcase = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState<string>("all");
  const [kind, setKind] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  useEffect(() => {
    (async () => {
      const { data } = await api
        .from("materials")
        .select("id,title,description,url,file_type,file_name,file_size,created_at,section_subjects(subjects(name,grade_level,school_level,color),sections(name))")
        .order("created_at", { ascending: false })
        .limit(60);
      setMaterials((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const grades = useMemo(() => {
    const s = new Set<string>();
    materials.forEach((m) => {
      const g = m.section_subjects?.subjects?.grade_level;
      if (g) s.add(g);
    });
    return Array.from(s).sort();
  }, [materials]);

  const filtered = useMemo(() => {
    let list = materials.filter((m) => {
      if (grade !== "all" && m.section_subjects?.subjects?.grade_level !== grade) return false;
      if (kind !== "all" && kindOf(m) !== kind) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [materials, grade, kind, sort]);

  return (
    <div className="px-4 pb-4">
      {/* Filters */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
          <Filter className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <Chip label="All grades" active={grade === "all"} onClick={() => setGrade("all")} />
          {grades.map((g) => (
            <Chip key={g} label={`Grade ${g}`} active={grade === g} onClick={() => setGrade(g)} />
          ))}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
          <FileType2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <Chip label="All types" active={kind === "all"} onClick={() => setKind("all")} />
          <Chip label="PDF" active={kind === "pdf"} onClick={() => setKind("pdf")} />
          <Chip label="Image" active={kind === "image"} onClick={() => setKind("image")} />
          <Chip label="Doc" active={kind === "doc"} onClick={() => setKind("doc")} />
          <Chip label="Link" active={kind === "link"} onClick={() => setKind("link")} />
          <div className="flex-1" />
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
            <ArrowUpDown className="h-3 w-3" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="bg-card border border-border rounded px-1.5 py-1 text-[10px] font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">A–Z</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 py-8 text-center">
          <BookOpen className="h-7 w-7 mx-auto text-muted-foreground/50 mb-1.5" />
          <p className="text-xs text-muted-foreground">No modules match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {filtered.slice(0, 12).map((m) => {
            const k = kindOf(m);
            const subj = m.section_subjects?.subjects;
            const KindIcon = k === "pdf" ? FileText : k === "image" ? ImageIcon : k === "link" ? Link2 : FileText;
            const tone =
              k === "pdf" ? "bg-destructive/10 text-destructive border-destructive/30"
              : k === "image" ? "bg-info/10 text-info border-info/30"
              : k === "link" ? "bg-accent/15 text-accent-foreground border-accent/40"
              : "bg-primary/10 text-primary border-primary/30";
            return (
              <div key={m.id} className="rounded-xl border border-border bg-card card-shadow overflow-hidden flex flex-col">
                <div className={`sacred-gradient relative px-2.5 py-3 flex items-center gap-2`}>
                  <div className="h-9 w-9 rounded-lg bg-primary-foreground/15 border border-accent/30 flex items-center justify-center backdrop-blur-sm">
                    <KindIcon className="h-4 w-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-accent/90">
                      {subj?.grade_level ? `Grade ${subj.grade_level}` : "Module"}
                    </p>
                    <p className="text-[11px] font-bold text-primary-foreground truncate">
                      {subj?.name || "Library"}
                    </p>
                  </div>
                </div>
                <div className="p-2.5 flex-1 flex flex-col">
                  <h4 className="text-[12px] font-bold text-foreground leading-tight line-clamp-2">{m.title}</h4>
                  {m.description && <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{m.description}</p>}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
                    <Badge className={`text-[8px] font-bold uppercase border ${tone}`} variant="outline">
                      {k} · {formatSize(m.file_size)}
                    </Badge>
                    {m.url && (
                      <Button asChild size="sm" className="h-6 px-2 text-[10px] font-bold rounded-md">
                        <a href={m.url} target="_blank" rel="noreferrer" download={m.file_name || true}>
                          <Download className="h-3 w-3 mr-1" /> Open
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap border transition-all flex-shrink-0 ${
      active
        ? "sacred-gradient text-primary-foreground border-accent/40 shadow-sm"
        : "bg-card text-muted-foreground border-border hover:border-primary/40"
    }`}
  >
    {label}
  </button>
);

export default ModulesShowcase;