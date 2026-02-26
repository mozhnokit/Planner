"use client";

import { useState } from "react";
import { Team, TeamMember } from "@/types";
import { useLocale } from "@/context/LocaleContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, Trash2 } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface TeamMembersModalProps {
  team: Team | null;
  members: TeamMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string) => Promise<{ error?: Error | null }>;
  onRemove: (userId: string) => Promise<void>;
  isOwner: boolean;
}

export function TeamMembersModal({
  team,
  members,
  open,
  onOpenChange,
  onInvite,
  onRemove,
  isOwner,
}: TeamMembersModalProps) {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInvite = async () => {
    if (!email.trim()) return;
    
    setLoading(true);
    setError("");
    const result = await onInvite(email.trim());
    if (result.error) {
      setError(result.error.message);
    } else {
      setEmail("");
    }
    setLoading(false);
  };

  const handleRemove = async (userId: string) => {
    if (userId === team?.owner_id) return;
    await onRemove(userId);
  };

  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {team.name} - {t("teamMembers")}
          </DialogTitle>
          <DialogDescription>
            {t("manageTeamMembers") || "Manage your team members"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Members List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(member.user?.full_name, member.user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {member.user?.full_name || member.user?.email || t("unknown")}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {t(member.role) || member.role}
                    </p>
                  </div>
                </div>
                {isOwner && member.user_id !== team.owner_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleRemove(member.user_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Invite Form */}
          {isOwner && (
            <div className="space-y-2 pt-4 border-t">
              <label className="text-sm font-medium flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                {t("inviteByEmail")}
              </label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                />
                <Button onClick={handleInvite} disabled={loading || !email.trim()}>
                  {loading ? t("inviting") : t("invite")}
                </Button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
