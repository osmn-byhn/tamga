import React from 'react';
import { Minus, Square, X } from 'lucide-react';
import { useLocation, Link } from "react-router-dom";
import { Search } from 'lucide-react';
import GlobalSearch from './GlobalSearch';

const TitleBar = () => {

  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navItems = [
    { path: "/connections", icon: "bi-diagram-3-fill", label: "Connections" },
    { path: "/settings", icon: "bi-gear-wide-connected", label: "Settings" },
  ];

  const handleMinimize = () => {
    console.log("Minimizing window...");
    if (window.windowControls) {
      window.windowControls.minimize();
    } else {
      console.error("windowControls is not available");
      window.ipcRenderer?.send('window-minimize');
    }
  };

  const handleMaximize = () => {
    console.log("Maximizing window...");
    if (window.windowControls) {
      window.windowControls.maximize();
    } else {
      console.error("windowControls is not available");
      window.ipcRenderer?.send('window-maximize');
    }
  };

  const handleClose = () => {
    console.log("Closing window...");
    if (window.windowControls) {
      window.windowControls.close();
    } else {
      console.error("windowControls is not available");
      window.ipcRenderer?.send('window-close');
    }
  };

  return (
    <div className="h-10 flex items-center justify-between bg-background/60 backdrop-blur-xl border-b border-border/50 select-none sticky top-0 z-[100] w-full" style={{ WebkitAppRegion: 'drag' }}>
      {/* Left Side: Logo and Title */}
      <div className="flex items-center gap-3 px-4 h-full">
        <div className="w-6 h-6 flex items-center justify-center bg-primary rounded-md shadow-lg shadow-primary/20">
          <img src="./tamga.png" alt="Tamga" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground/80">Tamga</span>
      </div>

      {/* Center: Draggable Spacer */}
      <div className="flex-1 h-full" />

      {/* Right Side: Window Controls */}
      <div className="flex items-center h-full relative z-50" style={{ WebkitAppRegion: 'no-drag' }}>
        
        <button
          onClick={() => setSearchOpen(true)}
          className="relative group flex items-center gap-2 px-3 h-8 mr-1 rounded-lg transition-all duration-300 ease-out hover:bg-muted text-muted-foreground hover:text-foreground"
          title="Search Vault (Cmd/Ctrl+K)"
        >
          <Search className="h-4 w-4 transition-transform duration-300 group-hover:scale-105" />
        </button>

        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`
            relative group flex items-center gap-2 px-3 h-8 rounded-lg transition-all duration-300 ease-out
            ${isActive(item.path)
                ? "bg-primary text-primary-foreground shadow-md"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }
          `}
          >
            <i
              className={`bi ${item.icon} text-md transition-transform duration-300 ${isActive(item.path) ? "scale-105" : "group-hover:scale-105"}`}
            ></i>
          </Link>
        ))}

        <button
          onClick={handleMinimize}
          className="h-full px-4 hover:bg-muted transition-colors flex items-center justify-center group"
          title="Minimize"
        >
          <Minus className="w-4 h-4 text-foreground/60 group-hover:text-foreground" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-full px-4 hover:bg-muted transition-colors flex items-center justify-center group"
          title="Maximize"
        >
          <Square className="w-3.5 h-3.5 text-foreground/60 group-hover:text-foreground" />
        </button>
        <button
          onClick={handleClose}
          className="h-full px-4 hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center justify-center group"
          title="Close"
        >
          <X className="w-4 h-4 text-foreground/60 group-hover:text-current" />
        </button>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
};

export default TitleBar;
