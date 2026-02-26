"use client";

import { useState } from "react";
import { Task, Priority, TaskStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { priorityConfig, statusConfig } from "@/lib/utils";
import { useComments } from "@/hooks/useComments";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Trash2, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TaskModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Partial<Task>) => void;
  onDelete?: () => void;
  users?: Array<{ id: string; email: string; full_name?: string }>;
  t: (key: string) => string;
}

export function TaskModal({ task, open, onOpenChange, onSave, onDelete, users, t }: TaskModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState<Priority>(task?.priority || "medium");
  const [status, setStatus] = useState<TaskStatus>(task?.status || "todo");
  const [deadline, setDeadline] = useState(task?.deadline ? task.deadline.slice(0, 16) : "");
  const [assignee, setAssignee] = useState(task?.assignee_id || "");
  const [commentText, setCommentText] = useState("");

  const { comments, addComment, deleteComment } = useComments(task?.id);

  const handleSave = () => {
    onSave({
      title,
      description,
      priority,
      status,
      deadline: deadline || null,
      assignee_id: assignee || null,
    });
    onOpenChange(false);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await addComment(commentText.trim());
    setCommentText("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? t("editTask") : t("createTask")}</DialogTitle>
          <DialogDescription className="sr-only">
            {task ? t("editTaskDesc") : t("createTaskDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("title")}</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("taskTitle")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("description")}</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("taskDescription")}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("priority")}</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className={config.color}>{t(config.labelKey || key)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("status")}</label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className={config.color}>{t(config.labelKey || key)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("deadline")}</label>
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("assignee")}</label>
              <Select value={assignee || "unassigned"} onValueChange={(v) => setAssignee(v === "unassigned" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectAssignee")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">{t("unassigned")}</SelectItem>
                  {users?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comments Section */}
          {task && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium">{t("comments")}</h4>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                <AnimatePresence>
                  {comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="glass p-3 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {getInitials(comment.user?.full_name, comment.user?.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">
                            {comment.user?.full_name || comment.user?.email || t("unknown")}
                          </span>
                        </div>
                        {comment.user_id === user?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => deleteComment(comment.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm mt-1 ml-8">{comment.content}</p>
                      <span className="text-xs text-muted-foreground ml-8">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="flex gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t("addComment")}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <Button size="icon" onClick={handleAddComment}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {task && onDelete && (
            <Button variant="destructive" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave}>
            {task ? t("saveChanges") : t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
