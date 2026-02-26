"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTasks } from "@/hooks/useTasks";
import { useTeams } from "@/hooks/useTeams";
import { usePresence } from "@/hooks/usePresence";
import { useLocale } from "@/context/LocaleContext";
import { TaskModal } from "./TaskModal";
import { TaskCard } from "./TaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { TeamSwitcher } from "@/components/teams/TeamSwitcher";
import { CreateTeamModal } from "@/components/teams/CreateTeamModal";
import { TeamMembersModal } from "@/components/teams/TeamMembersModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Filter, Users, Zap, LogOut, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Task, Priority, TaskStatus, Team, TeamMember } from "@/types";
import { priorityConfig, getInitials } from "@/lib/utils";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";

export function Dashboard() {
  const { user, signOut, updatePresence } = useAuth();
  const { onlineUsers } = usePresence();
  const { t } = useLocale();
  const {
    teams,
    currentTeam,
    setCurrentTeam,
    members,
    createTeam,
    inviteMember,
    removeMember,
  } = useTeams();
  
  const [filter, setFilter] = useState<'all' | 'my-tasks' | 'urgent'>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // Team state
  const [taskScope, setTaskScope] = useState<'personal' | 'team'>('personal');
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks({ 
    filter,
    scope: taskScope,
    teamId: taskScope === 'team' ? currentTeam?.id : null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !activeTask) return;

    // Обработка изменения статуса при перетаскивании
    const overId = over.id as string;
    const newStatus = overId as TaskStatus;
    
    if (newStatus && newStatus !== activeTask.status) {
      await updateTask(activeTask.id, { status: newStatus });
    }

    setActiveTask(null);
  }, [activeTask, updateTask]);

  const handleDragStart = useCallback((event: any) => {
    const task = event.active?.data?.current?.task;
    if (task) {
      setActiveTask(task);
    }
  }, []);

  const filteredTasks = tasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter.length > 0 && !statusFilter.includes(task.status)) {
      return false;
    }
    return true;
  });

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (selectedTask) {
      await updateTask(selectedTask.id, taskData);
    } else {
      await createTask({
        ...taskData,
        priority: taskData.priority || 'medium',
        status: taskData.status || 'todo',
        deadline: taskData.deadline || null,
        assignee_id: taskData.assignee_id || null,
        team_id: taskScope === 'team' ? currentTeam?.id || null : null,
        is_private: taskScope === 'personal',
      } as Omit<Task, 'id' | 'created_at' | 'updated_at'>);
    }
  };

  const handleDeleteTask = async () => {
    if (selectedTask) {
      await deleteTask(selectedTask.id);
      setIsModalOpen(false);
    }
  };

  const handleCreateTeam = async (name: string, description: string) => {
    await createTeam(name, description);
  };

  const handleInviteMember = async (email: string) => {
    if (!currentTeam) return;
    const result = await inviteMember(currentTeam.id, email);
    if (result.error) {
      alert(result.error.message);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!currentTeam) return;
    await removeMember(currentTeam.id, userId);
  };

  // Получаем список пользователей для назначения
  const [users, setUsers] = useState<Array<{ id: string; email: string; full_name?: string }>>([]);
  
  useState(() => {
    const fetchUsers = async () => {
      // В реальном приложении здесь был бы запрос к API
      // Для сейчас используем онлайн пользователей
    };
    fetchUsers();
  });

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Header */}
        <header className="sticky top-0 z-50 glass border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                  {t("teamFlow")}
                </h1>
              </div>

              <div className="flex items-center gap-4">
                {/* Language Switcher */}
                <LanguageSwitcher />

                {/* Team Switcher */}
                <TeamSwitcher
                  teams={teams as unknown as Team[]}
                  currentTeam={currentTeam as unknown as Team | null}
                  onTeamChange={(id) => setCurrentTeam(teams.find(t => t.id === id) as unknown as Team | null)}
                  onScopeChange={setTaskScope}
                  currentScope={taskScope}
                  onCreateTeam={() => setIsCreateTeamModalOpen(true)}
                  onManageMembers={() => setIsMembersModalOpen(true)}
                />

                {/* Online Users */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex -space-x-2">
                    {onlineUsers.slice(0, 5).map((presence) => (
                      <Avatar key={presence.user_id} className="h-8 w-8 border-2 border-background">
                        <AvatarFallback className="text-xs bg-primary/20">
                          {getInitials(presence.user?.full_name, presence.user?.email)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {onlineUsers.length} {t("online")}
                  </span>
                </div>

                {/* User Menu */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/20">
                      {getInitials(user?.user_metadata?.full_name, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="ghost" size="sm" onClick={() => { signOut(); updatePresence(); }}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("signOut")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 space-y-4"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchTasks")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass"
                />
              </div>

              <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                <SelectTrigger className="w-[180px] glass">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allTasks")}</SelectItem>
                  <SelectItem value="my-tasks">{t("myTasks")}</SelectItem>
                  <SelectItem value="urgent">{t("urgent")}</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleCreateTask} className="bg-gradient-to-r from-primary to-purple-500">
                <Plus className="h-4 w-4 mr-2" />
                {t("newTask")}
              </Button>
            </div>

            {/* Status Filter Pills */}
            <div className="flex gap-2 flex-wrap">
              {Object.entries(priorityConfig).map(([key, config]) => (
                <Button
                  key={key}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Можно добавить фильтрацию по приоритету
                  }}
                  className={`${config.bgColor} ${config.color} hover:${config.bgColor}`}
                >
                  {config.label}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Task Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(priorityConfig) as Priority[]).map((priority) => (
              <div key={priority} className="space-y-3">
                <div className={`flex items-center gap-2 pb-2 border-b ${priorityConfig[priority].color}`}>
                  <h2 className="font-semibold">{priorityConfig[priority].label}</h2>
                  <span className="text-xs text-muted-foreground">
                    {filteredTasks.filter(t => t.priority === priority).length}
                  </span>
                </div>
                
                <div className="space-y-2 min-h-[200px]">
                  <AnimatePresence>
                    {filteredTasks
                      .filter(task => task.priority === priority)
                      .map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onClick={() => handleEditTask(task)}
                        />
                      ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading tasks...</p>
            </div>
          )}

          {!loading && filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p>{t("noTasksFound")}</p>
              <Button variant="link" onClick={handleCreateTask}>
                {t("createFirstTask")}
              </Button>
            </div>
          )}
        </main>

        {/* Task Modal */}
        <TaskModal
          task={selectedTask}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          users={users}
          t={t}
        />

        {/* Create Team Modal */}
        <CreateTeamModal
          open={isCreateTeamModalOpen}
          onOpenChange={setIsCreateTeamModalOpen}
          onCreate={handleCreateTeam}
        />

        {/* Team Members Modal */}
        <TeamMembersModal
          team={currentTeam as unknown as Team | null}
          members={members as unknown as TeamMember[]}
          open={isMembersModalOpen}
          onOpenChange={setIsMembersModalOpen}
          onInvite={handleInviteMember}
          onRemove={handleRemoveMember}
          isOwner={currentTeam?.owner_id === user?.id}
        />
      </div>
    </DndContext>
  );
}
