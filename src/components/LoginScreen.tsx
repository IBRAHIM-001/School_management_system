import React, { useState } from 'react';
import { UserAccount } from '../types';
import { Shield, User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
  userAccounts: UserAccount[];
}

export default function LoginScreen({ onLoginSuccess, userAccounts }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setErrorMessage('Please type in both your workstation username and security password.');
      return;
    }

    // 1. Search for matching username in database (case-insensitive)
    const matchedAccount = userAccounts.find(
      acc => acc.username.toLowerCase() === cleanUsername.toLowerCase()
    );

    // 2. Validate Username existence
    if (!matchedAccount) {
      setErrorMessage(`Authentication Error: The username "${cleanUsername}" is not registered in the system user directory.`);
      return;
    }

    // 3. Validate Password matching
    if (password !== matchedAccount.password_hash) {
      setErrorMessage(`Authentication Error: Incorrect security password entered for workstation account "${matchedAccount.username}".`);
      return;
    }

    // Success
    setErrorMessage(null);
    onLoginSuccess(matchedAccount);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-teal-500 selection:text-white">
      {/* Background decoration lines */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-teal-500/20 to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.03)_0,transparent_60%)] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Branding header block */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500 border border-teal-400/30 text-white shadow-[0_0_20px_rgba(20,184,166,0.15)]">
            <span className="font-black text-xl tracking-tight font-display">AQ</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight text-white font-display uppercase">AL-QALAM ACADEMY GUSAU</h1>
            <p className="text-slate-400 text-xs font-mono tracking-widest uppercase mt-1 font-bold">Offline Workstation Gateway</p>
          </div>
        </div>

        {/* Credentials Form Box */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative">
          
          <div className="mb-6">
            <h2 className="text-slate-200 font-bold text-sm tracking-wide uppercase font-sans">Security Checkpoint</h2>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Role-Based Access Control (RBAC) active</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Workstation Username</label>
              <div className="relative">
                <input
                  id="inp-login-username"
                  type="text"
                  placeholder="e.g. admin"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-teal-500/60 rounded-xl py-3 pl-10 pr-4 text-slate-100 placeholder-slate-600 font-sans focus:outline-none focus:ring-1 focus:ring-teal-500/30 transition-all font-medium"
                  required
                />
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-600" />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Security Pass Phrase</label>
              <div className="relative">
                <input
                  id="inp-login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-teal-500/60 rounded-xl py-3 pl-10 pr-10 text-slate-100 placeholder-slate-600 font-sans focus:outline-none focus:ring-1 focus:ring-teal-500/30 transition-all font-semibold font-mono"
                  required
                />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-600" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 p-1 rounded hover:bg-slate-850 text-slate-500 hover:text-slate-350 transition select-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error notifications inline */}
            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex gap-2.5 items-start text-xs text-rose-450 animate-in fade-in duration-200">
                <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5 font-medium">
                  <span className="font-bold block text-rose-400">Authentication Failed</span>
                  <p className="text-rose-300 leading-normal">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Submit Trigger */}
            <button
              id="btn-login-submit"
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-[0_4px_12px_rgba(20,184,166,0.15)] flex items-center justify-center gap-2 select-none cursor-pointer active:scale-98"
            >
              <Shield className="h-4 w-4" />
              Authorize Workstation Space
            </button>
          </form>
        </div>

        {/* Security Warning notice */}
        <div className="text-center font-mono">
          <p className="text-[9px] text-slate-500 opacity-60 leading-normal uppercase">
            Internal Secure Console • Al-Qalam Educational Systems Ltd.
            <br />
            IP Logged • Strict Audit Trail Verified
          </p>
        </div>

      </div>

    </div>
  );
}

