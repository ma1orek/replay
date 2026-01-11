// In-memory job storage for generation jobs
// In production, use Redis/Supabase/etc.

export interface GenerationJob {
  status: "pending" | "processing" | "complete" | "failed";
  progress: number;
  message: string;
  code?: string;
  title?: string;
  error?: string;
  userId: string;
  createdAt: number;
}

// Use global to persist across hot reloads in development
declare global {
  var generationJobs: Map<string, GenerationJob> | undefined;
}

// Initialize if not exists
if (!global.generationJobs) {
  global.generationJobs = new Map();
}

export function getJobStorage(): Map<string, GenerationJob> {
  return global.generationJobs!;
}

export function getJob(jobId: string): GenerationJob | undefined {
  return global.generationJobs?.get(jobId);
}

export function setJob(jobId: string, job: GenerationJob): void {
  global.generationJobs?.set(jobId, job);
}

export function updateJob(jobId: string, updates: Partial<GenerationJob>): void {
  const job = global.generationJobs?.get(jobId);
  if (job) {
    global.generationJobs?.set(jobId, { ...job, ...updates });
  }
}
