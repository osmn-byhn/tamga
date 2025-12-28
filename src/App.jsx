import { HashRouter, Routes, Route } from "react-router-dom";
import RootLayout from "./components/RootLayout";
import Envs from "./pages/Envs";
import OtpCodes from "./pages/OtpCodes";
import Passkeys from "./pages/Passkeys";
import Passwords from "./pages/Passwords";
import Settings from "./pages/Settings";

function App() {
  return (
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
  );
}

export default App;
