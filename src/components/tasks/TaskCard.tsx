"use client";

import { motion } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task, Priority, TaskStatus } from "@/types";
import { priorityConfig, statusConfig, formatDeadline, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Calendar, AlertCircle } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  assignee?: { email: string; full_name?: string; avatar_url?: string };
}

export function TaskCard({ task, onClick, assignee }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card rounded-lg p-4 cursor-pointer border-l-4 hover:shadow-lg transition-all"
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-foreground line-clamp-1 flex-1">{task.title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${priority.bgColor} ${priority.color}`}>
          {priority.label}
        </span>
      </div>

      {task.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {assignee ? (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {getInitials(assignee.full_name, assignee.email)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="h-3 w-3 text-muted-foreground" />
            </div>
          )}

          {task.deadline && (
            <div className={`flex items-center gap-1 text-xs ${
              new Date(task.deadline) < new Date() ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              <Calendar className="h-3 w-3" />
              <span>{formatDeadline(task.deadline)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
