import React, { useContext, useEffect, useState } from 'react';
import { jwtDecode as jwt_decode } from "jwt-decode";
import io from 'socket.io-client';
import AuthContext from '../../context/AuthContext'
import { Link } from 'react-router-dom'

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000';

const FriendRequest = () => {
    const { logoutUser } = useContext(AuthContext);
    const token = localStorage.getItem("authTokens");
    const decoded = jwt_decode(token)
    const user_id = decoded.user_id
    const [users, setUsers] = useState([]);   
    const [socket, setSocket] = useState(null);
    const [friendRequests, setFriendRequests] = useState([]); 

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

    useEffect(() => {
        if (!socket) return;
        socket.emit('get_friend', {
            user_id: user_id,
        });
        socket.on('get_friend', (data) => {
            console.log(data)
            if (data.userCurrent === user_id)
                setUsers(prev => [...data.user_data]);
        });
        socket.on('sever_return_login_user', (data) => {
            const userItem = document.querySelector(`li[data-userid="${data}"]`);
            console.log(userItem)
            if (userItem) {
                const statusIndicator = userItem.querySelector('.status-indicator');
                if (statusIndicator) {
                    statusIndicator.classList.add('online');
                    statusIndicator.classList.remove('offline');
                    statusIndicator.textContent = 'Online';
                }
            }
        });
        socket.on('sever_return_logout_user', (data) => {
            const userItem = document.querySelector(`li[data-userid="${data}"]`);
            console.log(userItem)
            if (userItem) {
                const statusIndicator = userItem.querySelector('.status-indicator');
                if (statusIndicator) {
                    statusIndicator.classList.remove('online');
                    statusIndicator.classList.add('offline');
                    statusIndicator.textContent = 'Offline';
                }
            }
        });
        socket.on('server_return_accept_friend', (data) => {
            if (data.receiver_id === user_id)
                setUsers(prev => [...prev, data.user_data])
        })
        socket.on('server_return_cancel_friend', (data) => {
            if (data.receiver_id === user_id) {
                const userItem = document.querySelector(`li[data-userid="${data.sender_id}"]`);
                if (userItem) {
                    userItem.remove()
                }
            }
        });
        socket.on('user_connected', (data) => {
            console.log('User connected:', data.message);
        });
        socket.on('user_disconnected', (data) => {
            console.log('User disconnected:', data.message);
        });
        return () => {
            socket.off('get_friend')
            socket.off('user_connected');
            socket.off('user_disconnected');
        };
    }, [socket, friendRequests]);

    const handleCancelFriend = async (userId) => {
        socket.emit('cancel_friend', {
            user_id: user_id,
            receiver_id: userId,
        });
        setFriendRequests([...friendRequests, userId]);
    };

    return (
        <>
            <div className="navbar-list">
                <Link to="/">
                    <i className="fas fa-inbox" /> Inbox
                </Link>
                <Link to="/profile">
                    <i className="fas fa-user" /> Profile
                </Link>
                <Link to="/friend-request/">
                    <i className="fas fa-user-plus" /> Friend Requests
                </Link>
                <a href='#' style={{backgroundColor: "black"}}>
                    <i className="fas fa-users" /> Friends List
                </a>
                <Link to="/user-list/">
                    <i className="fas fa-address-book" /> User List
                </Link>
                <Link onClick={logoutUser}>
                    <i className="fas fa-sign-out-alt" /> Log Out
                </Link>
            </div>
            <div className="container-list">
                <div className="friend-container">
                    <div className="friend-list">
                        {users.map(user => (
                            <>
                                {user.id !== user_id &&
                                    <li key={user.id} className="friend-card1" data-userid={user.id}>
                                        <img
                                            alt="Person"
                                            height={150}
                                            src={SOCKET_URL + user.image}
                                            width={150}
                                        />
                                        <span>{user.fullname}</span>
                                        <button style={{ backgroundColor: "#4D4F50" }} onClick={() => handleCancelFriend(user.id)}>
                                            Unfriend
                                        </button>
                                    </li>
                                }
                            </>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default FriendRequest;
