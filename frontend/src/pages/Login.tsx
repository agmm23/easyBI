import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, Lock, LogIn, AlertCircle } from 'lucide-react';

declare global {
    interface Window {
        google: any;
    }
}

export function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect to where the user came from, or home
    const from = location.state?.from?.pathname || "/";

    useEffect(() => {
        // Initialize Google Sign-In
        const loadGoogle = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE",
                    callback: handleGoogleResponse
                });
                window.google.accounts.id.renderButton(
                    document.getElementById("googleBtn"),
                    { theme: "outline", size: "large", width: "100%" }
                );
            }
        };

        // Load script if not present
        if (!document.getElementById('google-client-script')) {
            const script = document.createElement('script');
            script.src = "https://accounts.google.com/gsi/client";
            script.id = "google-client-script";
            script.async = true;
            script.defer = true;
            script.onload = loadGoogle;
            document.body.appendChild(script);
        } else {
            loadGoogle();
        }
    }, []);

    const handleGoogleResponse = async (response: any) => {
        try {
            await googleLogin(response.credential);
            navigate(from, { replace: true });
        } catch (err: any) {
            setError('Google Login failed: ' + err.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(username, password);
            navigate(from, { replace: true });
        } catch (err: any) {
            setError(err.message || 'Failed to login');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                <div className="text-center mb-8">
                    <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                    <p className="text-gray-500 mt-2">Please sign in to continue</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 flex items-center text-sm">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Google Sign In */}
                <div className="mb-6">
                    <div id="googleBtn" className="w-full flex justify-center"></div>
                    {/* Fallback if no client ID */}
                    {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                        <p className="text-xs text-center text-gray-400 mt-2">
                            (Configure VITE_GOOGLE_CLIENT_ID in .env for Google Login)
                        </p>
                    )}
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with username</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition sm:text-sm h-11"
                                placeholder="Enter your username"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition sm:text-sm h-11"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition items-center"
                    >
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Default credentials: <strong>admin</strong> / <strong>admin</strong></p>
                    <p className="mt-4">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
