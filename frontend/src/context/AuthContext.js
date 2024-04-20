import { createContext, useState, useEffect } from 'react';
import jwtDecode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export default AuthContext;

export const AuthProvider = ({children}) => {
    let [user, setUser] = useState(() => (Cookies.get('authTokens') ? jwtDecode(Cookies.get('authTokens')) : null)); // Получение токена из куков
    let [authTokens, setAuthTokens] = useState(() => (Cookies.get('authTokens') ? JSON.parse(Cookies.get('authTokens')) : null)); // Получение токена из куков
    let [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    let loginUser = async (e) => {
        e.preventDefault();
        const response = await fetch('http://127.0.0.1:8000/api/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({"email": e.target.email.value, "password": e.target.password.value })
        });

        let data = await response.json();

        if(data){
            alert(JSON.stringify(data.access))
            alert(JSON.stringify(data.refresh))
            Cookies.set('access', JSON.stringify(data.access), {expires: 1, path: '/', httpOnly: true, sameSite: 'Strict' }); // Установка http-only куков
            Cookies.set('refresh', JSON.stringify(data.refresh), {expires: 90, path: '/', httpOnly: true, sameSite: 'Strict' }); // Установка http-only куков
            setAuthTokens(data);
            setUser(jwtDecode(data.access));
            navigate('/');
        } else {
            alert('Something went wrong while logging in the user!');
        }
    };

    let logoutUser = () => {
        Cookies.remove('authTokens'); // Удаление куков
        setAuthTokens(null);
        setUser(null);
        navigate('/login');
    };

    const updateToken = async () => {
        const response = await fetch('http://127.0.0.1:8000/api/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type':'application/json'
            },
            body:JSON.stringify({"refresh":authTokens?.refresh})
        })
        console.log(authTokens )
       
        const data = await response.json()
        if (response.status === 200) {
            setAuthTokens(data)
            setUser(jwtDecode(data.access))
            localStorage.setItem('authTokens',JSON.stringify(data))
        } else {
            logoutUser()
        }

        if(loading){
            setLoading(false)
        }
    }

    let contextData = {
        user:user,
        authTokens:authTokens,
        loginUser:loginUser,
        logoutUser:logoutUser,
    }

    useEffect(()=>{
        if(loading){
            updateToken()
        }

        const REFRESH_INTERVAL = 1000 * 60 * 4 // 4 minutes
        let interval = setInterval(()=>{
            if(authTokens){
                updateToken()
            }
        }, REFRESH_INTERVAL)
        return () => clearInterval(interval)

    },[authTokens, loading])

    return(
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    )
}