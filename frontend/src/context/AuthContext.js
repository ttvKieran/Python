import {createContext, useState, useEffect} from "react";
import { jwtDecode as jwt_decode } from 'jwt-decode';
import {useHistory} from "react-router-dom";
import io from 'socket.io-client';
const swal = require('sweetalert2')

const AuthContext = createContext();
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000';

export default AuthContext

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() =>
        localStorage.getItem("authTokens")
            ? JSON.parse(localStorage.getItem("authTokens"))
            : null
    );

    const [user, setUser] = useState(() => 
        localStorage.getItem("authTokens")
            ? jwt_decode(localStorage.getItem("authTokens"))
            : null
    );

    const [socket, setSocket] = useState(null);
    //Kết nối socket
    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket'],
            cors: {
                origin: "http://localhost:3000",
                credentials: true
            },
            withCredentials: true
        });
        newSocket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });
        setSocket(newSocket);
        return () => newSocket.close();
    }, []);

    // useEffect(() => {
    //     if (!socket) return;
    //     socket.emit('get_friend', {
    //         user_id: user_id,
    //     });
    //     socket.on('get_friend', (data) => {
    //         if (data.userCurrent === user_id)
    //             setUsers(prev => [...data.user_data]);
    //     });
    //     socket.on('user_connected', (data) => {
    //         console.log('User connected:', data.message);
    //     });
    //     socket.on('user_disconnected', (data) => {
    //         console.log('User disconnected:', data.message);
    //     });
    //     return () => {
    //         socket.off('get_friend')
    //         socket.off('user_connected');
    //         socket.off('user_disconnected');
    //     };
    // }, [socket]);

    const [loading, setLoading] = useState(true);

    const history = useHistory();

    const loginUser = async (email, password) => {
        const response = await fetch("http://127.0.0.1:8000/api/token/", {
            method: "POST",
            headers:{
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                email, password
            })
        })
        const data = await response.json()

        if(response.status === 200){
            setAuthTokens(data)
            setUser(jwt_decode(data.access))
            const newUser = jwt_decode(data.access)
            console.log(newUser.user_id)

            socket.emit('login_user', {
                'user_id': newUser.user_id,
            });

            localStorage.setItem("authTokens", JSON.stringify(data))
            history.push("/")
            swal.fire({
                title: "Login Successful",
                icon: "success",
                toast: true,
                timer: 6000,
                position: 'top-right',
                timerProgressBar: true,
                showConfirmButton: false,
            })

        } else {    
            console.log(response.status);
            console.log("there was a server issue");
            swal.fire({
                title: "Username or passowrd does not exists",
                icon: "error",
                toast: true,
                timer: 6000,
                position: 'top-right',
                timerProgressBar: true,
                showConfirmButton: false,
            })
        }
    }

    const registerUser = async (email, username, password, password2) => {
        try {
            const response = await fetch("http://127.0.0.1:8000/api/register/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email, username, password, password2
                })
            });
    
            // Nếu đăng ký thành công
            if (response.status === 201) {
                history.push("/");
                swal.fire({
                    title: "Registration Successful, Login Now",
                    icon: "success",
                    toast: true,
                    timer: 6000,
                    position: 'top-right',
                    timerProgressBar: true,
                    showConfirmButton: false,
                });
            } else {
                // Lấy thông tin lỗi từ response
                const errorData = await response.json();
                console.log("Error Data:", errorData);
    
                let errorMessage = "Đã xảy ra lỗi trên server.";
                if (errorData.password) {
                    // Nếu có lỗi về password
                    errorMessage = errorData.password.join("\n");
                } else if (errorData.username) {
                    // Nếu có lỗi về username
                    errorMessage = errorData.username.join("\n");
                } else if (errorData.email) {
                    // Nếu có lỗi về email
                    errorMessage = errorData.email.join("\n");
                } else {
                    // Nếu các lỗi khác
                    errorMessage = "Username or email has already been used. Please try again with a different one.";
                }
    
                swal.fire({
                    title: errorMessage,
                    icon: "error",
                    toast: true,
                    timer: 10000,
                    position: 'top-right',
                    timerProgressBar: true,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            console.error("Network Error:", error);
            swal.fire({
                title: "Network Error: Không thể kết nối tới server.",
                icon: "error",
                toast: true,
                timer: 10000,
                position: 'top-right',
                timerProgressBar: true,
                showConfirmButton: false,
            });
        }
    };

    const logoutUser = () => {
        console.log(user.user_id)

        socket.emit('logout_user', {
            'user_id': user.user_id,
        });

        setAuthTokens(null)
        setUser(null)
        localStorage.removeItem("authTokens")
        history.push("/authentication")
        swal.fire({
            title: "You have been logged out...",
            icon: "success",
            toast: true,
            timer: 6000,
            position: 'top-right',
            timerProgressBar: true,
            showConfirmButton: false,
        })
    }

    const contextData = {
        user, 
        setUser,
        authTokens,
        setAuthTokens,
        registerUser,
        loginUser,
        logoutUser,
    }

    useEffect(() => {
        if (authTokens) {
            setUser(jwt_decode(authTokens.access))
        }
        setLoading(false)
    }, [authTokens, loading])

    return (
        <AuthContext.Provider value={contextData}>
            {loading ? null : children}
        </AuthContext.Provider>
    )

}