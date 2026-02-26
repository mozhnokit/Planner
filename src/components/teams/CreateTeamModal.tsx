"use client";

import { useState } from "react";
import { useLocale } from "@/context/LocaleContext";
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

interface CreateTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, description: string) => Promise<void>;
}

export function CreateTeamModal({ open, onOpenChange, onCreate }: CreateTeamModalProps) {
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    setLoading(true);
    await onCreate(name.trim(), description.trim());
    setLoading(false);
    setName("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createTeam")}</DialogTitle>
          <DialogDescription>
            {t("createTeamDesc") || "Create a new team to collaborate with others"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("teamName")}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Team"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("teamDescription")}</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your team..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading ? t("loading") : t("createTeam")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
