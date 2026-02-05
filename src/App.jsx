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

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AuthProvider>
        <LockScreen />
        <HashRouter>
          <Routes>
            <Route path="/" element={<RootLayout />}>
              <Route index element={<Passwords />} />
              <Route path="env-files" element={<Envs />} />
              <Route path="otps" element={<OtpCodes />} />
              <Route path="backup-codes" element={<Passkeys />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
