import { Outlet, Link, useLocation } from "react-router-dom";
import Bar from "./Bar";

export default function RootLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Bar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <Outlet />
      </main>
    </div>
  );
}
