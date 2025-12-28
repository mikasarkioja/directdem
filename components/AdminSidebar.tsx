"use client";

import { FileText, Users, BarChart3, Home, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";

type AdminView = "overview" | "bills" | "users" | "reports";

interface AdminSidebarProps {
  activeView: AdminView;
  setActiveView: (view: AdminView) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export default function AdminSidebar({
  activeView,
  setActiveView,
  darkMode,
  setDarkMode,
}: AdminSidebarProps) {
  const router = useRouter();

  const menuItems = [
    { id: "overview" as AdminView, label: "Overview", icon: Home },
    { id: "bills" as AdminView, label: "Bills", icon: FileText },
    { id: "users" as AdminView, label: "Users", icon: Users },
    { id: "reports" as AdminView, label: "Reports", icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-nordic-deep dark:bg-nordic-darker text-nordic-white flex flex-col border-r border-nordic-darker">
      <div className="p-6 border-b border-nordic-darker">
        <h1 className="text-2xl font-bold">DirectDem</h1>
        <p className="text-sm text-nordic-gray mt-1">Admin Dashboard</p>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? "bg-nordic-blue text-white"
                  : "text-nordic-gray hover:bg-nordic-darker hover:text-nordic-white"
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-nordic-darker space-y-2">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-nordic-gray hover:bg-nordic-darker hover:text-nordic-white transition-colors"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          <span className="font-medium">{darkMode ? "Light Mode" : "Dark Mode"}</span>
        </button>
        <button
          onClick={() => router.push("/")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-nordic-gray hover:bg-nordic-darker hover:text-nordic-white transition-colors"
        >
          <Home size={20} />
          <span className="font-medium">Back to App</span>
        </button>
      </div>
    </aside>
  );
}

