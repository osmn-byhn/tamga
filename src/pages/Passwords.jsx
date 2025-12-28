import { useState, useEffect } from "react";
import { Copy, RefreshCw, Check, Save, Moon } from "lucide-react";

export default function Passwords() {
  const [password, setPassword] = useState("");
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    let charset = "";
    let newPassword = "";

    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (includeNumbers) charset += "0123456789";
    if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (charset === "") {
      setPassword("Please select at least one option");
      return;
    }

    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    setPassword(newPassword);
    setCopied(false);
  };
  useEffect(() => {
    if (
      password ||
      includeUppercase ||
      includeLowercase ||
      includeNumbers ||
      includeSymbols
    ) {
      generatePassword();
    }
  }, [
    length,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
  ]);

  const copyToClipboard = () => {
    if (password && password !== "Please select at least one option") {
      navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getPasswordStrength = () => {
    if (!password || password === "Please select at least one option")
      return { text: "", color: "" };

    let strength = 0;
    if (password.length >= 12) strength++;
    if (password.length >= 16) strength++;
    if (includeUppercase && includeLowercase) strength++;
    if (includeNumbers) strength++;
    if (includeSymbols) strength++;

    if (strength <= 2)
      return { text: "Weak", color: "text-red-600 dark:text-red-400" };
    if (strength <= 3)
      return { text: "Medium", color: "text-yellow-600 dark:text-yellow-400" };
    return { text: "Strong", color: "text-green-600 dark:text-green-400" };
  };

  const strength = getPasswordStrength();

  return (
    <div className={"dark"}>
      <div>
        <h1 className="text-2xl font-bold mb-4">Passwords</h1>
      </div>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Main Content - Horizontal Layout */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Left Side - Password Display & Generation */}
              <div className="p-8 border-r border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Generated Password
                </h2>

                {/* Password Display */}
                <div className="mb-6">
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 mb-3 min-h-[80px] flex items-center justify-between border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-900 dark:text-white text-xl font-mono break-all flex-1">
                      {password || "Click generate to create password"}
                    </p>
                    <button
                      onClick={copyToClipboard}
                      className="ml-3 p-3 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                      disabled={
                        !password ||
                        password === "Please select at least one option"
                      }
                    >
                      {copied ? (
                        <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <Copy className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                  {strength.text && (
                    <p className={`text-sm font-semibold ${strength.color}`}>
                      Strength: {strength.text}
                    </p>
                  )}
                </div>

                {/* Length Slider */}
                <div className="mb-6">
                  <div className="flex justify-between mb-3">
                    <label className="text-gray-700 dark:text-gray-300 font-medium">
                      Password Length
                    </label>
                    <span className="text-gray-900 dark:text-white font-bold text-lg">
                      {length}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="32"
                    value={length}
                    onChange={(e) => setLength(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gray-900 dark:accent-gray-100"
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={generatePassword}
                  className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-bold py-4 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200 shadow-sm flex items-center justify-center gap-2"
                  disabled={
                    !password ||
                    password === "Please select at least one option"
                  }
                >
                  <RefreshCw className="w-5 h-5" />
                  Generate Password
                </button>
                <button
                  onClick={generatePassword}
                  className="w-full bg-transparent text-black dark:text-white font-bold py-4 rounded-lg  transition-colors duration-200 shadow-sm flex items-center justify-center gap-2 mt-2 border-2 border-gray-900 dark:border-gray-300 cursor-pointer"
                  disabled={
                    !password ||
                    password === "Please select at least one option"
                  }
                >
                  <Save className="w-5 h-5" />
                  Generate Password
                </button>
              </div>

              {/* Right Side - Options */}
              <div className="p-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Settings
                </h2>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      Include Uppercase (A-Z)
                    </span>
                    <input
                      type="checkbox"
                      checked={includeUppercase}
                      onChange={(e) => setIncludeUppercase(e.target.checked)}
                      className="w-5 h-5 accent-gray-900 dark:accent-gray-100 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      Include Lowercase (a-z)
                    </span>
                    <input
                      type="checkbox"
                      checked={includeLowercase}
                      onChange={(e) => setIncludeLowercase(e.target.checked)}
                      className="w-5 h-5 accent-gray-900 dark:accent-gray-100 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      Include Numbers (0-9)
                    </span>
                    <input
                      type="checkbox"
                      checked={includeNumbers}
                      onChange={(e) => setIncludeNumbers(e.target.checked)}
                      className="w-5 h-5 accent-gray-900 dark:accent-gray-100 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      Include Symbols (!@#$%)
                    </span>
                    <input
                      type="checkbox"
                      checked={includeSymbols}
                      onChange={(e) => setIncludeSymbols(e.target.checked)}
                      className="w-5 h-5 accent-gray-900 dark:accent-gray-100 cursor-pointer"
                    />
                  </label>
                </div>

                <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-8">
                  Create strong, secure passwords for your accounts
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
