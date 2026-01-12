import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    username: string;
    email?: string;
    full_name?: string;
    disabled?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    googleLogin: (token: string) => Promise<void>;
    logout: () => void;
    authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const response = await fetch('http://localhost:8000/users/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const userData = await response.json();
                        setUser(userData);
                    } else {
                        // Token invalid/expired
                        logout();
                    }
                } catch (error) {
                    console.error("Auth init error:", error);
                    logout();
                }
            }
            setLoading(false);
        };

        if (token) {
            initAuth();
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (username: string, password: string) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch('http://localhost:8000/token', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Login failed');
        }

        const data = await response.json();
        const accessToken = data.access_token;
        localStorage.setItem('token', accessToken);
        setToken(accessToken);

        // Fetch user details immediately
        const meResponse = await fetch('http://localhost:8000/users/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (meResponse.ok) {
            setUser(await meResponse.json());
        }
    };

    const googleLogin = async (googleToken: string) => {
        const response = await fetch('http://localhost:8000/google-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: googleToken }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Google Login failed');
        }

        const data = await response.json();
        const accessToken = data.access_token;
        localStorage.setItem('token', accessToken);
        setToken(accessToken);

        // Fetch user details immediately
        const meResponse = await fetch('http://localhost:8000/users/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (meResponse.ok) {
            setUser(await meResponse.json());
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    // Wrapper for authenticated requests
    const authFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        const config = {
            ...init,
            headers
        };

        const response = await fetch(input, config);

        if (response.status === 401) {
            // Token expired or invalid during request
            logout();
        }

        return response;
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, googleLogin, logout, authFetch }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
