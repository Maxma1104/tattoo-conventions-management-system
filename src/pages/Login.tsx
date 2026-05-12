import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LogIn, AlertCircle, UserPlus } from 'lucide-react';

export const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'manager' | 'artist'>('artist');
  const [error, setError] = useState('');
  
  const { login, signup, user, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'manager') {
        navigate('/manager/dashboard');
      } else {
        navigate('/artist/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isSignUp) {
        if (!password || password.length < 6) {
          setError('Password must be at least 6 characters.');
          return;
        }
        await signup(email, password, name, role);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === 'Email not confirmed') {
        setError('登录失败：Supabase 默认开启了邮箱验证。请前往 Supabase Dashboard -> Authentication -> Providers -> Email 中关闭 "Confirm email" 选项，或前往邮箱点击验证链接。');
      } else {
        setError(err.message || 'Invalid email/password or user not found.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-4xl font-bold text-red-500 tracking-wider">INKFLOW</h1>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          {isSignUp ? 'Create an account' : 'Sign in to your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Convention Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-zinc-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-md p-3 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}
            
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    required={isSignUp}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-zinc-600 rounded-md shadow-sm placeholder-zinc-500 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm bg-zinc-900 text-white"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-zinc-600 rounded-md shadow-sm placeholder-zinc-500 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm bg-zinc-900 text-white"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-zinc-600 rounded-md shadow-sm placeholder-zinc-500 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm bg-zinc-900 text-white"
                  placeholder={isSignUp ? "Min 6 characters" : "Leave empty for legacy demo accounts"}
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Role
                </label>
                <div className="mt-2 flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="artist"
                      checked={role === 'artist'}
                      onChange={(e) => setRole(e.target.value as 'artist')}
                      className="text-red-600 focus:ring-red-500 bg-zinc-900 border-zinc-600"
                    />
                    <span className="ml-2 text-zinc-300">Artist</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="manager"
                      checked={role === 'manager'}
                      onChange={(e) => setRole(e.target.value as 'manager')}
                      className="text-red-600 focus:ring-red-500 bg-zinc-900 border-zinc-600"
                    />
                    <span className="ml-2 text-zinc-300">Manager</span>
                  </label>
                </div>
              </div>
            )}

            {!isSignUp && (
              <div className="text-xs text-zinc-400 bg-zinc-900 p-3 rounded border border-zinc-700">
                <p className="font-medium text-zinc-300 mb-1">Legacy Demo Accounts (No password required):</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Manager: manager@test.com</li>
                  <li>Artist: artist1@test.com</li>
                </ul>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                    {isSignUp ? 'Sign Up' : 'Sign In'}
                  </span>
                )}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
