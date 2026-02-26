"use client";

import { useState, useCallback, useEffect } from "react";
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

  const { tasks, loading, createTask, updateTask, deleteTask, refetch } = useTasks({
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

    const overId = over.id as string;
    const newStatus = overId as TaskStatus;

    if (newStatus && newStatus !== activeTask.status) {
      await updateTask(activeTask.id, { status: newStatus });
    }
    setActiveTask(null);
  }, [activeTask, updateTask]);

  const handleDragStart = useCallback((event: any) => {
    const task = event.active?.data?.current?.task;
    if (task) setActiveTask(task);
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
    try {
      if (selectedTask) {
        await updateTask(selectedTask.id, taskData);
      } else {
        const newTask = {
          ...taskData,
          title: taskData.title?.trim() || 'Untitled',
          description: taskData.description?.trim() || '',
          priority: taskData.priority || 'medium',
          status: taskData.status || 'todo',
          deadline: taskData.deadline || null,
          assignee_id: taskData.assignee_id || null,
          team_id: taskScope === 'team' ? currentTeam?.id || null : null,
          is_private: taskScope === 'personal',
        } as Omit<Task, 'id' | 'created_at' | 'updated_at'>;
        
        const result = await createTask(newTask);
        if (result.error) {
          console.error('Error creating task:', result.error);
          alert('Failed to create task: ' + result.error.message);
        } else {
          await refetch();
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Error saving task');
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

  const handleInviteMember = async (email: string): Promise<{ error?: Error | null }> => {
    if (!currentTeam) return { error: new Error('No team selected') };
    const result = await inviteMember(currentTeam.id, email);
    if (result.error) {
      alert(result.error.message);
    }
    return result;
  };

  const handleRemoveMember = async (userId: string) => {
    if (!currentTeam) return;
    await removeMember(currentTeam.id, userId);
  };

  // Load users for assignment
  const [users, setUsers] = useState<Array<{ id: string; email: string; full_name?: string }>>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      // Load team members for assignment
      if (members.length > 0) {
        setUsers(members.map(m => ({
          id: m.user_id,
          email: m.user?.email || '',
          full_name: m.user?.full_name || undefined,
        })));
      }
    };
    fetchUsers();
  }, [members]);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Header */}
        <header className="sticky top-0 z-50 glass border-b shadow-lg">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Logo */}
              <motion.div 
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Zap className="h-8 w-8 text-primary animate-pulse-glow" />
                </motion.div>
                <h1 className="text-xl md:text-2xl font-bold gradient-text">
                  {t("teamFlow")}
                </h1>
              </motion.div>

              {/* Controls */}
              <div className="flex items-center gap-2 md:gap-4 flex-wrap">
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
                <motion.div 
                  className="hidden lg:flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex -space-x-2">
                    {onlineUsers.slice(0, 4).map((presence) => (
                      <Avatar key={presence.user_id} className="h-7 w-7 border-2 border-background">
                        <AvatarFallback className="text-xs bg-primary/20">
                          {getInitials(presence.user?.full_name, presence.user?.email)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {onlineUsers.length} {t("online")}
                  </span>
                </motion.div>

                {/* User Menu */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/20">
                      {getInitials(user?.user_metadata?.full_name, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { signOut(); updatePresence(); }}
                    className="hidden sm:flex"
                  >
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
            transition={{ delay: 0.1 }}
            className="mb-6 space-y-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchTasks")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass hover-lift"
                />
              </div>

              <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                <SelectTrigger className="w-[160px] glass hover-lift">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allTasks")}</SelectItem>
                  <SelectItem value="my-tasks">{t("myTasks")}</SelectItem>
                  <SelectItem value="urgent">{t("urgent")}</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={handleCreateTask} 
                className="bg-gradient-to-r from-primary to-purple-500 hover-lift animate-pulse-glow"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("newTask")}
              </Button>
            </div>
          </motion.div>

          {/* Task Board */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {(Object.keys(priorityConfig) as Priority[]).map((priority) => (
              <motion.div 
                key={priority} 
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
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
              </motion.div>
            ))}
          </motion.div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
              />
            </div>
          )}

          {!loading && filteredTasks.length === 0 && (
            <motion.div 
              className="flex flex-col items-center justify-center py-12 text-muted-foreground"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p className="mb-4">{t("noTasksFound")}</p>
              <Button variant="link" onClick={handleCreateTask}>
                {t("createFirstTask")}
              </Button>
            </motion.div>
          )}
        </main>

        {/* Modals */}
        <TaskModal
          task={selectedTask}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          users={users}
          t={t}
        />

        <CreateTeamModal
          open={isCreateTeamModalOpen}
          onOpenChange={setIsCreateTeamModalOpen}
          onCreate={handleCreateTeam}
        />

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
