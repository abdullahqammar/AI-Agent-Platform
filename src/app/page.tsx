
import {
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  Users,
  Bot,
  Building2,
  BookOpen,
  Settings,
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock3,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Sparkles,
  Send,
  ChevronDown,
  Zap,
} from "lucide-react";

const navigation = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Conversations", icon: MessageSquare, count: "12" },
  { label: "Appointments", icon: CalendarDays },
  { label: "Customers", icon: Users },
];

const management = [
  { label: "AI Agents", icon: Bot },
  { label: "Businesses", icon: Building2 },
  { label: "Knowledge Base", icon: BookOpen },
];

const metrics = [
  {
    label: "Total conversations",
    value: "1,284",
    change: "+12.8%",
    positive: true,
    icon: MessageSquare,
  },
  {
    label: "AI resolution rate",
    value: "86.4%",
    change: "+5.2%",
    positive: true,
    icon: Sparkles,
  },
  {
    label: "Appointments",
    value: "148",
    change: "+8.1%",
    positive: true,
    icon: CalendarDays,
  },
  {
    label: "Active customers",
    value: "892",
    change: "+3.6%",
    positive: true,
    icon: Users,
  },
];

const conversations = [
  {
    initials: "AK",
    name: "Ahmed Khan",
    message: "Can I book a dental cleaning for Monday?",
    time: "2 min ago",
    status: "Needs attention",
    color: "bg-blue-100 text-blue-700",
  },
  {
    initials: "SA",
    name: "Sarah Ahmed",
    message: "Thank you, that answers my question!",
    time: "8 min ago",
    status: "Resolved",
    color: "bg-purple-100 text-purple-700",
  },
  {
    initials: "UM",
    name: "Usman Malik",
    message: "Do you offer teeth whitening?",
    time: "15 min ago",
    status: "AI handling",
    color: "bg-amber-100 text-amber-700",
  },
];

const appointments = [
  { name: "Ahmed Khan", service: "Dental cleaning", time: "10:00 AM", status: "Pending" },
  { name: "Sarah Ahmed", service: "Dental checkup", time: "11:30 AM", status: "Confirmed" },
  { name: "Usman Malik", service: "Tooth filling", time: "02:00 PM", status: "Confirmed" },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Bot size={23} />
          </div>
          <div>
            <h1 className="font-bold tracking-tight">AgentFlow</h1>
            <p className="text-xs text-slate-500">AI Business Platform</p>
          </div>
        </div>

        <div className="px-4 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Workspace
          </p>
          <nav className="space-y-1">
            {navigation.map((item) => (
              <a
                key={item.label}
                href="#"
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium ${
                  item.active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-3">
                  <item.icon size={18} />
                  {item.label}
                </span>
                {item.count && (
                  <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                    {item.count}
                  </span>
                )}
              </a>
            ))}
          </nav>

          <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Management
          </p>
          <nav className="space-y-1">
            {management.map((item) => (
              <a
                key={item.label}
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <item.icon size={18} />
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-100 p-4">
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
            <Settings size={18} />
            Settings
          </a>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              AD
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Administrator</p>
              <p className="text-xs text-slate-500">Platform owner</p>
            </div>
            <MoreHorizontal size={18} className="text-slate-400" />
          </div>
        </div>
      </aside>

      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur md:px-8">
          <div>
            <p className="text-xs text-slate-500">Workspace / Overview</p>
            <h2 className="mt-1 text-lg font-bold">Dashboard</h2>
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 sm:flex">
              <Search size={16} />
              Search
              <span className="rounded border px-1.5 text-xs">⌘ K</span>
            </button>
            <button className="relative rounded-lg border border-slate-200 p-2.5 text-slate-600">
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
              <Plus size={17} />
              <span className="hidden sm:inline">New agent</span>
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-8 p-5 md:p-8">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Welcome back 👋</h1>
              <p className="mt-1 text-sm text-slate-500">
                Here&apos;s what&apos;s happening across your AI operations.
              </p>
            </div>
            <button className="flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
              <Clock3 size={16} />
              Last 30 days
              <ChevronDown size={15} />
            </button>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                  <metric.icon size={19} className="text-indigo-500" />
                </div>
                <p className="mt-4 text-3xl font-bold tracking-tight">{metric.value}</p>
                <div className="mt-3 flex items-center gap-1 text-xs">
                  {metric.positive ? (
                    <ArrowUpRight size={15} className="text-emerald-600" />
                  ) : (
                    <ArrowDownRight size={15} className="text-red-600" />
                  )}
                  <span className="font-semibold text-emerald-600">{metric.change}</span>
                  <span className="text-slate-400">vs previous period</span>
                </div>
              </div>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Conversation activity</h2>
                  <p className="mt-1 text-sm text-slate-500">AI conversations over the past week</p>
                </div>
                <button className="text-slate-400 hover:text-slate-700">
                  <MoreHorizontal size={20} />
                </button>
              </div>
              <div className="mt-8 flex h-48 items-end justify-between gap-3">
                {[42, 65, 52, 80, 61, 94, 73].map((height, index) => (
                  <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-md bg-indigo-500 transition hover:bg-indigo-700"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
                Conversations handled by AI
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">AI agent status</h2>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Operational
                </span>
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-lg bg-slate-50 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Bot size={23} />
                </div>
                <div>
                  <p className="text-sm font-semibold">BrightSmile Assistant</p>
                  <p className="text-xs text-slate-500">Dental clinic configuration</p>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">AI engine</span>
                  <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                    <CheckCircle2 size={15} /> Configured
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">WhatsApp</span>
                  <span className="flex items-center gap-1.5 font-medium text-amber-600">
                    <AlertCircle size={15} /> Not connected
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Knowledge base</span>
                  <span className="font-medium text-slate-700">Demo data</span>
                </div>
              </div>
              <button className="mt-6 w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Manage AI agent
              </button>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-3">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h2 className="font-semibold">Recent conversations</h2>
                  <p className="mt-1 text-sm text-slate-500">Latest customer interactions</p>
                </div>
                <a href="#" className="text-sm font-semibold text-indigo-600">View all</a>
              </div>
              <div className="divide-y divide-slate-100">
                {conversations.map((conversation) => (
                  <div key={conversation.name} className="flex items-center gap-3 p-5">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${conversation.color}`}>
                      {conversation.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{conversation.name}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{conversation.message}</p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-xs text-slate-400">{conversation.time}</p>
                      <p className="mt-1 text-xs font-medium text-slate-600">{conversation.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h2 className="font-semibold">Upcoming appointments</h2>
                  <p className="mt-1 text-sm text-slate-500">Today&apos;s appointment overview</p>
                </div>
                <CalendarDays size={19} className="text-indigo-500" />
              </div>
              <div className="divide-y divide-slate-100">
                {appointments.map((appointment) => (
                  <div key={appointment.name} className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{appointment.name}</p>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                        appointment.status === "Confirmed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{appointment.service}</span>
                      <span>{appointment.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4">
                <button className="w-full rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  View appointments
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-gradient-to-r from-indigo-700 to-violet-700 p-6 text-white shadow-sm md:flex md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-white/15 p-3">
                <Zap size={23} />
              </div>
              <div>
                <h2 className="font-semibold">Your AI platform is taking shape</h2>
                <p className="mt-1 max-w-xl text-sm text-indigo-100">
                  Connect your first WhatsApp business account to begin handling real customer conversations.
                </p>
              </div>
            </div>
            <button className="mt-5 flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 md:mt-0">
              Get started <Send size={15} />
            </button>
          </section>

          <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row">
            <span>AgentFlow · AI Business Platform</span>
            <span>Development environment · Demo data</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
