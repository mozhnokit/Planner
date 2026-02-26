"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Locale = "ru" | "en";

const translations = {
  en: {
    // Header
    "teamFlow": "Team Flow",
    "online": "online",
    "signOut": "Sign Out",
    
    // Filters
    "searchTasks": "Search tasks...",
    "allTasks": "All Tasks",
    "myTasks": "My Tasks",
    "urgent": "Urgent",
    "newTask": "New Task",
    
    // Priorities
    "low": "Low",
    "medium": "Medium",
    "high": "High",
    "urgent_priority": "Urgent",
    
    // Task Modal
    "editTask": "Edit Task",
    "createTask": "Create Task",
    "editTaskDesc": "Edit task details and comments",
    "createTaskDesc": "Create a new task",
    "title": "Title",
    "taskTitle": "Task title",
    "description": "Description",
    "taskDescription": "Task description",
    "priority": "Priority",
    "status": "Status",
    "deadline": "Deadline",
    "assignee": "Assignee",
    "selectAssignee": "Select assignee",
    "unassigned": "Unassigned",
    
    // Comments
    "comments": "Comments",
    "addComment": "Add a comment...",
    "unknown": "Unknown",
    
    // Actions
    "saveChanges": "Save Changes",
    "create": "Create",
    "cancel": "Cancel",
    "delete": "Delete",
    
    // Empty states
    "loadingTasks": "Loading tasks...",
    "noTasksFound": "No tasks found",
    "createFirstTask": "Create your first task",
    
    // Auth
    "signIn": "Sign In",
    "signUp": "Sign Up",
    "email": "Email",
    "password": "Password",
    "emailPlaceholder": "Enter your email",
    "passwordPlaceholder": "Enter your password",
    "noAccount": "Don't have an account?",
    "hasAccount": "Already have an account?",
    "fullName": "Full Name",
    "fullNamePlaceholder": "Enter your full name",
    "loading": "Loading...",
    
    // Language
    "language": "Language",
    "russian": "Русский",
    "english": "English",
    
    // Statuses
    "todo": "To Do",
    "inProgress": "In Progress",
    "review": "Review",
    "done": "Done",
    
    // Teams
    "teamTasks": "Team Tasks",
    "createTeam": "Create Team",
    "teamName": "Team Name",
    "teamDescription": "Description",
    "inviteMember": "Invite Member",
    "teamMembers": "Team Members",
    "inviteByEmail": "Invite by email",
    "createTeamDesc": "Create a new team to collaborate with others",
    "creating": "Creating...",
    "inviting": "Inviting...",
    "invite": "Invite",
    "member": "Member",
    "owner": "Owner",
    "admin": "Admin",
    "manageTeamMembers": "Manage your team members",
  },
  ru: {
    // Header
    "teamFlow": "Team Flow",
    "online": "онлайн",
    "signOut": "Выйти",
    
    // Filters
    "searchTasks": "Поиск задач...",
    "allTasks": "Все задачи",
    "myTasks": "Мои задачи",
    "urgent": "Срочные",
    "newTask": "Новая задача",
    
    // Priorities
    "low": "Низкий",
    "medium": "Средний",
    "high": "Высокий",
    "urgent_priority": "Срочно",
    
    // Task Modal
    "editTask": "Редактировать задачу",
    "createTask": "Создать задачу",
    "editTaskDesc": "Изменить детали задачи и комментарии",
    "createTaskDesc": "Создать новую задачу",
    "title": "Название",
    "taskTitle": "Название задачи",
    "description": "Описание",
    "taskDescription": "Описание задачи",
    "priority": "Приоритет",
    "status": "Статус",
    "deadline": "Дедлайн",
    "assignee": "Исполнитель",
    "selectAssignee": "Выбрать исполнителя",
    "unassigned": "Не назначен",
    
    // Comments
    "comments": "Комментарии",
    "addComment": "Добавить комментарий...",
    "unknown": "Неизвестно",
    
    // Actions
    "saveChanges": "Сохранить",
    "create": "Создать",
    "cancel": "Отмена",
    "delete": "Удалить",
    
    // Empty states
    "loadingTasks": "Загрузка задач...",
    "noTasksFound": "Задачи не найдены",
    "createFirstTask": "Создайте свою первую задачу",
    
    // Auth
    "signIn": "Войти",
    "signUp": "Зарегистрироваться",
    "email": "Email",
    "password": "Пароль",
    "emailPlaceholder": "Введите email",
    "passwordPlaceholder": "Введите пароль",
    "noAccount": "Нет аккаунта?",
    "hasAccount": "Уже есть аккаунт?",
    "fullName": "Полное имя",
    "fullNamePlaceholder": "Введите полное имя",
    "loading": "Загрузка...",
    
    // Language
    "language": "Язык",
    "russian": "Русский",
    "english": "English",
    
    // Statuses
    "todo": "Нужно сделать",
    "inProgress": "В процессе",
    "review": "На проверке",
    "done": "Готово",
    
    // Teams
    "teamTasks": "Командные задачи",
    "createTeam": "Создать команду",
    "teamName": "Название команды",
    "teamDescription": "Описание",
    "inviteMember": "Пригласить участника",
    "teamMembers": "Участники команды",
    "inviteByEmail": "Пригласить по email",
    "createTeamDesc": "Создайте новую команду для совместной работы",
    "creating": "Создание...",
    "inviting": "Приглашение...",
    "invite": "Пригласить",
    "member": "Участник",
    "owner": "Владелец",
    "admin": "Администратор",
    "manageTeamMembers": "Управление участниками команды",
  },
};

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof typeof translations.en) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ru");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale;
    if (saved && (saved === "ru" || saved === "en")) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  const t = (key: keyof typeof translations.en) => {
    return translations[locale][key] || translations.en[key] || key;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
