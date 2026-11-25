import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Вход — Rapport, личный секретарь" },
      { name: "description", content: "Панель владельца Telegram-бота: встречи, заявки и чаты." },
      { property: "og:title", content: "Вход — Rapport, личный секретарь" },
      { property: "og:description", content: "Панель владельца Telegram-бота: встречи, заявки и чаты." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/meetings" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/meetings" });
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        toast.success("Проверьте почту и подтвердите адрес, затем войдите.");
        setMode("in");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sidebar font-display text-xl text-sidebar-primary">R</div>
          <h1 className="text-3xl font-bold">Rapport</h1>
          <p className="mt-2 text-muted-foreground">Личная панель вашего Telegram-секретаря.</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw">Пароль</Label>
            <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "in" ? "Войти" : "Создать аккаунт владельца"}
          </Button>
          <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "Первый вход? Создать аккаунт" : "Уже есть аккаунт? Войти"}
          </button>
          <p className="text-xs text-muted-foreground">Доступ получает только первый зарегистрированный аккаунт.</p>
        </form>
        <Button variant="outline" asChild className="mt-4 w-full"><Link to="/business">Бизнес-Тиндер + Бадди · Демо</Link></Button>
      </div>
    </main>
  );
}
