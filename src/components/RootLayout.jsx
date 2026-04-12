import { Outlet, Link, useLocation } from "react-router-dom";
import Bar from "./Bar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function RootLayout() {
  const { isLocked, hasPassword } = useAuth();
  const location = useLocation();

  const isConnections = location.pathname === "/connections";

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground transition-colors duration-300",
      isConnections && "h-screen overflow-hidden"
    )}>
      {!isLocked && hasPassword && <Bar />}
      <main className={cn(
        "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24",
        isConnections && "max-w-none p-0 h-full w-full"
      )}>
        <Outlet />
      </main>
    </div>
  );
}
