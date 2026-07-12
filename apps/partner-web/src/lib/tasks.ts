/**
 * Assigned tasks with a per-task stopwatch. An owner/manager assigns a task to
 * a member; the member starts/pauses/completes it from their Overview and the
 * elapsed time is tracked. Backed by Firestore `orgTasks` (see firestore.rules).
 */
import {
  addDoc, collection, doc, onSnapshot, query, updateDoc, where,
} from 'firebase/firestore';
import { db } from '../firebase.js';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  note?: string;
  assigneeUid: string;
  assigneeName: string;
  createdBy: string;
  status: TaskStatus;
  /** Time banked from finished running segments. */
  accumulatedMs: number;
  /** Epoch ms the current running segment began; null/absent when paused. */
  startedAtMs: number | null;
  createdAtMs: number;
  /** Finish-by deadline (epoch ms), if the assigner set one. */
  dueAtMs?: number;
  completedAtMs?: number;
}

function fromSnap(id: string, d: Record<string, unknown>): Task {
  return {
    id,
    title: (d.title as string) ?? '',
    assigneeUid: (d.assigneeUid as string) ?? '',
    assigneeName: (d.assigneeName as string) ?? '',
    createdBy: (d.createdBy as string) ?? '',
    status: (d.status as TaskStatus) ?? 'todo',
    accumulatedMs: (d.accumulatedMs as number) ?? 0,
    startedAtMs: (d.startedAtMs as number | null) ?? null,
    createdAtMs: (d.createdAtMs as number) ?? 0,
    ...(d.note ? { note: d.note as string } : {}),
    ...(d.dueAtMs ? { dueAtMs: d.dueAtMs as number } : {}),
    ...(d.completedAtMs ? { completedAtMs: d.completedAtMs as number } : {}),
  };
}

/** A task is overdue if it has a deadline that has passed and it isn't done. */
export function isOverdue(t: Task, now = Date.now()): boolean {
  return t.status !== 'done' && t.dueAtMs != null && t.dueAtMs < now;
}

/** Live elapsed time including the currently-running segment. */
export function elapsedMs(t: Task, now = Date.now()): number {
  return t.accumulatedMs + (t.startedAtMs ? now - t.startedAtMs : 0);
}

export function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export async function createTask(input: { title: string; note?: string; assigneeUid: string; assigneeName: string; createdBy: string; dueAtMs?: number }): Promise<void> {
  await addDoc(collection(db, 'orgTasks'), {
    title: input.title.trim(),
    assigneeUid: input.assigneeUid,
    assigneeName: input.assigneeName,
    createdBy: input.createdBy,
    status: 'todo',
    accumulatedMs: 0,
    startedAtMs: null,
    createdAtMs: Date.now(),
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    ...(input.dueAtMs ? { dueAtMs: input.dueAtMs } : {}),
  });
}

export async function startTask(t: Task): Promise<void> {
  await updateDoc(doc(db, 'orgTasks', t.id), { status: 'in_progress', startedAtMs: Date.now() });
}

export async function pauseTask(t: Task): Promise<void> {
  const banked = t.accumulatedMs + (t.startedAtMs ? Date.now() - t.startedAtMs : 0);
  await updateDoc(doc(db, 'orgTasks', t.id), { accumulatedMs: banked, startedAtMs: null });
}

export async function completeTask(t: Task): Promise<void> {
  const banked = t.accumulatedMs + (t.startedAtMs ? Date.now() - t.startedAtMs : 0);
  await updateDoc(doc(db, 'orgTasks', t.id), { status: 'done', startedAtMs: null, accumulatedMs: banked, completedAtMs: Date.now() });
}

/** Live subscription to a member's tasks (newest first). */
export function watchTasksFor(uid: string, cb: (tasks: Task[]) => void): () => void {
  return onSnapshot(query(collection(db, 'orgTasks'), where('assigneeUid', '==', uid)), (qs) => {
    cb(qs.docs.map((d) => fromSnap(d.id, d.data())).sort((a, b) => b.createdAtMs - a.createdAtMs));
  });
}

/** Live subscription to every task (for the Team page overview). */
export function watchAllTasks(cb: (tasks: Task[]) => void): () => void {
  return onSnapshot(collection(db, 'orgTasks'), (qs) => {
    cb(qs.docs.map((d) => fromSnap(d.id, d.data())).sort((a, b) => b.createdAtMs - a.createdAtMs));
  });
}
