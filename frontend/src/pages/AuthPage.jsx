import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, User } from 'lucide-react';
import Cookies from 'js-cookie';
import { login, signup } from '../api/auth';

export default function AuthPage() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        await signup({ name, email, password });
        Cookies.set('userName', name, { expires: 20 });
        setIsSignup(false);
        setError('');
        setPassword('');
      } else {
        await login({ email, password });
        navigate('/dashboard');
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const messages = Object.values(data.errors).flat().join('. ');
        setError(messages);
      } else {
        setError(data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gatex-bg p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-gatex-border bg-gatex-green text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)]">
            <Zap size={28} />
          </div>
          <h1 className="text-3xl font-extrabold text-white">GateX</h1>
          <p className="mt-1 text-sm text-slate-400">API Gateway Platform</p>
        </div>

        <div className="rounded-lg border-2 border-gatex-border bg-gatex-card p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
          <div className="mb-6 flex rounded-lg border-2 border-gatex-border bg-gatex-bg p-1">
            <button
              type="button"
              onClick={() => { setIsSignup(false); setError(''); }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                !isSignup ? 'bg-gatex-green text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setIsSignup(true); setError(''); }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                isSignup ? 'bg-gatex-green text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            {isSignup && (
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  required
                  className="w-full rounded-lg border-2 border-gatex-border bg-gatex-bg py-3 pl-11 pr-4 text-white placeholder-slate-500 outline-none transition-colors focus:border-gatex-green"
                />
              </div>
            )}

            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full rounded-lg border-2 border-gatex-border bg-gatex-bg py-3 pl-11 pr-4 text-white placeholder-slate-500 outline-none transition-colors focus:border-gatex-green"
              />
            </div>

            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full rounded-lg border-2 border-gatex-border bg-gatex-bg py-3 pl-11 pr-4 text-white placeholder-slate-500 outline-none transition-colors focus:border-gatex-green"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg border-2 border-black bg-gatex-green py-3 text-sm font-bold text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] transition-colors hover:bg-gatex-green-hover disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {isSignup && (
            <p className="mt-4 text-center text-xs text-slate-500">
              Password must be 8+ chars with uppercase and a number.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
