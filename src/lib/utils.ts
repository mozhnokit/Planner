import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Priority, TaskStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const priorityConfig: Record<Priority, { label: string; labelKey: string; color: string; bgColor: string }> = {
  low: { label: 'Low', labelKey: 'low', color: 'text-priority-low', bgColor: 'bg-priority-low/20' },
  medium: { label: 'Medium', labelKey: 'medium', color: 'text-priority-medium', bgColor: 'bg-priority-medium/20' },
  high: { label: 'High', labelKey: 'high', color: 'text-priority-high', bgColor: 'bg-priority-high/20' },
  urgent: { label: 'Urgent', labelKey: 'urgent_priority', color: 'text-priority-urgent', bgColor: 'bg-priority-urgent/20' },
};

export const statusConfig: Record<TaskStatus, { label: string; labelKey: string; color: string }> = {
  todo: { label: 'To Do', labelKey: 'todo', color: 'text-slate-400' },
  'in-progress': { label: 'In Progress', labelKey: 'inProgress', color: 'text-blue-400' },
  review: { label: 'Review', labelKey: 'review', color: 'text-yellow-400' },
  done: { label: 'Done', labelKey: 'done', color: 'text-green-400' },
};

export function getInitials(name?: string, email?: string): string {
  if (name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'U';
}

export function formatDeadline(deadline: string | null): string {
  if (!deadline) return '';
  
  const date = new Date(deadline);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)}d overdue`;
  } else if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays <= 7) {
    return `${diffDays}d left`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
