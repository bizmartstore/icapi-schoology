import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Home, Award } from "lucide-react";

export type QuizCertificateData = {
  studentName: string;
  quizTitle: string;
  subjectName?: string;
  sectionName?: string;
  score: number;
  totalPoints: number;
  attemptId: string;
  completedAt?: string;
};

export function formatControlNumber(attemptId: string) {
  return `ICAPI-${attemptId.replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

async function renderCertificateImage(data: QuizCertificateData): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 850;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const control = formatControlNumber(data.attemptId);
  const pct = data.totalPoints ? Math.round((data.score / data.totalPoints) * 100) : 0;
  const dateStr = data.completedAt
    ? new Date(data.completedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#1a2744");
  gradient.addColorStop(1, "#2d4a7c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 8;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.lineWidth = 2;
  ctx.strokeRect(56, 56, canvas.width - 112, canvas.height - 112);

  ctx.fillStyle = "#f5e6b8";
  ctx.font = "bold 28px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("iCAPI LMS", canvas.width / 2, 120);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 52px Georgia, serif";
  ctx.fillText("Certificate of Completion", canvas.width / 2, 190);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "24px Georgia, serif";
  ctx.fillText("This certifies that", canvas.width / 2, 260);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 44px Georgia, serif";
  ctx.fillText(data.studentName, canvas.width / 2, 330);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "24px Georgia, serif";
  ctx.fillText("has successfully completed the quiz", canvas.width / 2, 390);

  ctx.fillStyle = "#f5e6b8";
  ctx.font = "bold 36px Georgia, serif";
  ctx.fillText(data.quizTitle, canvas.width / 2, 450);

  if (data.subjectName || data.sectionName) {
    ctx.fillStyle = "#94a3b8";
    ctx.font="22px Georgia, serif";
    const subline = [data.subjectName, data.sectionName].filter(Boolean).join(" · ");
    ctx.fillText(subline, canvas.width / 2, 500);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px Georgia, serif";
  ctx.fillText(`Score: ${data.score} / ${data.totalPoints} (${pct}%)`, canvas.width / 2, 570);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "20px Georgia, serif";
  ctx.fillText(`Date: ${dateStr}`, canvas.width / 2, 630);

  ctx.fillStyle = "#d4af37";
  ctx.font = "bold 22px monospace";
  ctx.fillText(`Control No: ${control}`, canvas.width / 2, 700);

  ctx.fillStyle = "#64748b";
  ctx.font = "16px Georgia, serif";
  ctx.fillText("Learn today, lead tomorrow.", canvas.width / 2, 760);

  return canvas.toDataURL("image/png");
}

export async function downloadQuizCertificate(data: QuizCertificateData) {
  const dataUrl = await renderCertificateImage(data);
  const control = formatControlNumber(data.attemptId);
  const link = document.createElement("a");
  link.download = `iCAPI-certificate-${control}.png`;
  link.href = dataUrl;
  link.click();
}

type Props = {
  data: QuizCertificateData;
  onHome?: () => void;
  onClose?: () => void;
  homeLabel?: string;
};

const QuizCertificate = ({ data, onHome, onClose, homeLabel = "Back to Home" }: Props) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const control = formatControlNumber(data.attemptId);
  const pct = data.totalPoints ? Math.round((data.score / data.totalPoints) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur flex items-center justify-center p-4">
      <div ref={cardRef} className="bg-card rounded-3xl p-6 max-w-sm w-full text-center card-shadow border-2 border-accent/40 animate-fade-in">
        <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-3">
          <Award className="h-8 w-8 text-primary-foreground" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Certificate of Completion</p>
        <h3 className="text-xl font-extrabold text-foreground mt-1">{data.studentName}</h3>
        <p className="text-xs text-muted-foreground mt-1">completed</p>
        <p className="text-base font-bold text-primary mt-2">{data.quizTitle}</p>
        {(data.subjectName || data.sectionName) && (
          <p className="text-[11px] text-muted-foreground mt-1">
            {[data.subjectName, data.sectionName].filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="text-3xl font-extrabold text-foreground mt-4">
          {data.score}<span className="text-lg text-muted-foreground">/{data.totalPoints}</span>
        </p>
        <p className="text-xs text-muted-foreground">{pct}% · Passed</p>
        <div className="mt-4 rounded-xl bg-muted/40 px-3 py-2">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Control Number</p>
          <p className="text-sm font-mono font-bold text-foreground mt-0.5">{control}</p>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <Button className="w-full rounded-xl" onClick={() => downloadQuizCertificate(data)}>
            <Download className="h-4 w-4 mr-2" /> Download Certificate
          </Button>
          {onHome && (
            <Button variant="outline" className="w-full rounded-xl" onClick={onHome}>
              <Home className="h-4 w-4 mr-2" /> {homeLabel}
            </Button>
          )}
          {onClose && !onHome && (
            <Button variant="outline" className="w-full rounded-xl" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizCertificate;
