"use client";

import { useLocale } from "@/context/LocaleContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={locale} onValueChange={(v) => setLocale(v as "ru" | "en")}>
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ru">🇷🇺 Русский</SelectItem>
          <SelectItem value="en">🇺🇸 English</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
