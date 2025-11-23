import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    console.log('AuthProvider initialized, loading:', loading, 'user:', user);

    useEffect(() => {
        console.log('AuthProvider useEffect running, token:', token);
        try {
            if (token) {
                // Ideally verify token with backend here, for now just decoding or assuming valid if present
                // For a real app, we'd have a /me endpoint
                const savedUser = localStorage.getItem('user');
                console.log('Saved user from localStorage:', savedUser);
                if (savedUser) {
                    setUser(JSON.parse(savedUser));
                }
            }
        } catch (error) {
            console.error('Error in AuthProvider useEffect:', error);
        } finally {
            setLoading(false);
            console.log('AuthProvider loading set to false');
        }
    }, [token]);

    const login = async (username, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (!response.ok) {
                // Check if it's a pending approval error
                if (data.requiresApproval) {
                    throw new Error(data.error || 'Account pending approval');
                }
                throw new Error(data.error || 'Login failed');
            }

            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data; // Return data for pending approval check
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const signup = async (username, password, role) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Signup failed');
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
