export type TermNumber = 1 | 2 | 3;

export const TERM_LABELS: Record<TermNumber, string> = {
  1: "Term 1",
  2: "Term 2",
  3: "Term 3",
};

export const TERMS: TermNumber[] = [1, 2, 3];

export type TermGradeRow = {
  id: string;
  section_subject_id: string;
  student_id: string;
  term: TermNumber;
  final_average: number;
};

export type TermScores = Partial<Record<TermNumber, number | null>>;

export function parseGradeInput(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return Math.round(n * 100) / 100;
}

export function computeGeneralAverage(scores: TermScores): number | null {
  const vals = TERMS.map((t) => scores[t]).filter((v): v is number => v != null && !Number.isNaN(v));
  if (vals.length === 0) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  return Math.round((sum / vals.length) * 100) / 100;
}

export function gradesToTermScores(rows: TermGradeRow[], studentId: string, sectionSubjectId: string): TermScores {
  const scores: TermScores = {};
  rows
    .filter((r) => r.student_id === studentId && r.section_subject_id === sectionSubjectId)
    .forEach((r) => {
      scores[r.term as TermNumber] = Number(r.final_average);
    });
  return scores;
}

export const remark = (g: number) =>
  g >= 90 ? "Outstanding" : g >= 85 ? "Very Good" : g >= 80 ? "Good" : g >= 75 ? "Fair" : "Needs Improvement";

export const remarkColor = (g: number) =>
  g >= 90 ? "text-success" : g >= 80 ? "text-primary" : g >= 75 ? "text-warning" : "text-destructive";
