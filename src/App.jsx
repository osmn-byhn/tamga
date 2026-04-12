import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./context/AuthContext";
import LockScreen from "./components/LockScreen";
import RootLayout from "./components/RootLayout";
import Envs from "./pages/Envs";
import OtpCodes from "./pages/OtpCodes";
import Passkeys from "./pages/Passkeys";
import Passwords from "./pages/Passwords";
import Settings from "./pages/Settings";
import ItemDetail from "./pages/ItemDetail";
import GraphView from "./pages/GraphView";
import RecoveryCodes from "./pages/RecoveryCodes";

import { SettingsProvider } from "./context/SettingsContext";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <SettingsProvider>
        <AuthProvider>
          <LockScreen />
          <HashRouter>
            <Routes>
              <Route path="/" element={<RootLayout />}>
                <Route index element={<Passwords />} />
                <Route path="env-files" element={<Envs />} />
                <Route path="otps" element={<OtpCodes />} />
                <Route path="backup-codes" element={<Passkeys />} />
                <Route path="recovery-codes" element={<RecoveryCodes />} />
                <Route path="settings" element={<Settings />} />
                <Route path="details/:type/:id" element={<ItemDetail />} />
                <Route path="connections" element={<GraphView />} />
              </Route>
            </Routes>
          </HashRouter>
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
