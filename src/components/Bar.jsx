import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Copy, RefreshCw, Check, Sun, Moon } from "lucide-react";

const Bar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: "/", icon: "bi-key", label: "Passwords" },
    { path: "/otps", icon: "bi-qr-code-scan", label: "OTPs" },
    { path: "/backup-codes", icon: "bi-file-lock", label: "Backup" },
    { path: "/env-files", icon: "bi-file-binary-fill", label: "Env Files" },
    { path: "/settings", icon: "bi-gear-wide-connected", label: "Settings" },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-900 shadow-2xl rounded-full px-4 py-3 flex items-center gap-2 border border-gray-200 dark:border-gray-800 backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`
            relative group flex flex-col items-center gap-1 px-4 py-3 rounded-full transition-all duration-300 ease-out
            ${
              isActive(item.path)
                ? "bg-blue-500 text-white shadow-lg scale-110 "
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:scale-105"
            }
          `}
        >
          <i
            className={`bi ${item.icon} text-xl transition-transform duration-300 ${isActive(item.path) ? "scale-110" : "group-hover:scale-110"}`}
          ></i>
        </Link>
      ))}
    </div>
  );
};

export default Bar;
