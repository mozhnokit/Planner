"use client";

import { Team } from "@/types";
import { useLocale } from "@/context/LocaleContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";

interface TeamSwitcherProps {
  teams: Team[];
  currentTeam: Team | null;
  onTeamChange: (teamId: string) => void;
  onScopeChange: (scope: 'personal' | 'team') => void;
  currentScope: 'personal' | 'team';
  onCreateTeam: () => void;
  onManageMembers: () => void;
}

export function TeamSwitcher({
  teams,
  currentTeam,
  onTeamChange,
  onScopeChange,
  currentScope,
  onCreateTeam,
  onManageMembers,
}: TeamSwitcherProps) {
  const { t } = useLocale();

  return (
    <div className="flex items-center gap-2">
      {/* Scope Toggle */}
      <Select value={currentScope} onValueChange={(v) => onScopeChange(v as 'personal' | 'team')}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="personal">📁 {t("myTasks")}</SelectItem>
          <SelectItem value="team">👥 {t("teamTasks") || "Team Tasks"}</SelectItem>
        </SelectContent>
      </Select>

      {/* Team Selector */}
      {currentScope === 'team' && (
        <>
          <Select value={currentTeam?.id || ""} onValueChange={onTeamChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" onClick={onManageMembers}>
            <Users className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Create Team Button */}
      <Button variant="ghost" size="icon" onClick={onCreateTeam}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
