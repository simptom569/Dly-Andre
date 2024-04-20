import { createContext, useState, useEffect } from 'react';
import jwtDecode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export default AuthContext;

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => {
        const storedTokens = localStorage.getItem('authTokens');
        return storedTokens ? jwtDecode(JSON.parse(storedTokens).access) : null;
    });
    const [authTokens, setAuthTokens] = useState(() => {
        const storedTokens = localStorage.getItem('authTokens');
        return storedTokens ? JSON.parse(storedTokens) : null;
    });
    const [loading, setLoading] = useState(true);

    const loginUser = async (e) => {
        e.preventDefault();
        const response = await fetch('http://127.0.0.1:8000/api/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "email": e.target.email.value, "password": e.target.password.value })
        });

        const data = await response.json();

        if (data) {
            localStorage.setItem('authTokens', JSON.stringify(data));
            setUser(jwtDecode(data.access));
            navigate('/');
        } else {
            alert('Something went wrong while logging in the user!');
        }
    };

    const logoutUser = () => {
        localStorage.removeItem('authTokens');
        setAuthTokens(null);
        setUser(null);
        navigate('/login');
    };

    const updateToken = async () => {
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
                refresh: authTokens?.refresh
            });
            const data = response.data;

            localStorage.setItem('authTokens', JSON.stringify(data));
            setUser(jwtDecode(data.access));
        } catch (error) {
            logoutUser();
        }

        if (loading) {
            setLoading(false);
        }
    };

    const contextData = {
        user: user,
        authTokens: authTokens,
        loginUser: loginUser,
        logoutUser: logoutUser,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};
