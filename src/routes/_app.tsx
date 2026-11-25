import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KanbanSquare, CalendarDays, Inbox, MessagesSquare, Settings, LogOut, HeartHandshake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppLayout,
});

const NAV = [
  { to: "/business", label: "Бизнес + Бадди", icon: HeartHandshake },
  { to: "/meetings", label: "Встречи", icon: CalendarDays },
  { to: "/crm", label: "CRM", icon: KanbanSquare },
  { to: "/leads", label: "Заявки", icon: Inbox },
  { to: "/chats", label: "Чаты", icon: MessagesSquare },
  { to: "/settings", label: "Настройки", icon: Settings },
] as const;

function AppLayout() {
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return navigate({ to: "/" });
      const { data: owner } = await supabase.rpc("is_owner");
      if (active) setState(owner ? "ok" : "denied");
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s) navigate({ to: "/" });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  if (state === "loading") return <div className="grid min-h-screen place-items-center text-muted-foreground">Загрузка…</div>;
  if (state === "denied")
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-bold">Нет доступа</h1>
          <p className="mt-2 text-muted-foreground">Эта панель доступна только владельцу.</p>
          <button className="mt-4 text-primary underline" onClick={() => supabase.auth.signOut()}>Выйти</button>
        </div>
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 items-center gap-1 overflow-x-auto bg-sidebar p-3 text-sidebar-foreground md:w-60 md:flex-col md:items-stretch md:p-5">
        <div className="mr-3 font-display text-lg font-bold text-sidebar-primary md:mb-8 md:mr-0">Rapport</div>
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent"
            activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" }}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
        <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm opacity-70 hover:bg-sidebar-accent md:mt-auto">
          <LogOut className="h-4 w-4" /> Выйти
        </button>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}
