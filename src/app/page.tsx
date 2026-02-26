"use client";

import { useAuth } from "@/context/AuthContext";
import { Dashboard } from "@/components/tasks/Dashboard";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <Dashboard />;
}
