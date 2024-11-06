import React, { useContext, useEffect, useState } from 'react';
import { jwtDecode as jwt_decode } from "jwt-decode";
import io from 'socket.io-client';
import { Link } from 'react-router-dom'
import './style.css'

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000';

const FriendRequest = () => {
    // lấy tài khoản đăng nhập
    const token = localStorage.getItem("authTokens");
    const decoded = jwt_decode(token)
    const user_id = decoded.user_id
    const [users, setUsers] = useState([]);    // danh sách người dùng
    // const [loading, setLoading] = useState(true); 
    const [socket, setSocket] = useState(null);
    const [friendRequests, setFriendRequests] = useState([]); // Trạng thái lưu yêu cầu kết bạn

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
            if (data.userCurrent === user_id)
                setUsers(prev => [...data.user_data]);
        });
        socket.on('sever_return_login_user', (data) => {
            const userItem = document.querySelector(`li[data-userid="${data}"]`);
            console.log(userItem)
            if (userItem) {
                const statusIndicator = userItem.querySelector('.status-indicator');
                if (statusIndicator) {
                    // Thay đổi class
                    statusIndicator.classList.add('online');
                    statusIndicator.classList.remove('offline');

                    // Thay đổi text
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
                    // Thay đổi class
                    statusIndicator.classList.remove('online');
                    statusIndicator.classList.add('offline');

                    // Thay đổi text
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
        <div className="user-list">
            <Link className="btn btn-primary m1" to="/">Trò chuyện</Link>
            <Link className="btn btn-primary m1" to="/user-list/">Danh sách người dùng</Link>
            <Link className="btn btn-primary m1" to="/friend-list/">Danh sách bạn bè</Link>
            <Link className="btn btn-primary m1" to="/friend-request">Lời mời kết bạn</Link>
            <h2>Danh sách bạn bè</h2>
            <ul className="friend-list">
                {users.map(user => (
                    <>
                        {user.id !== user_id &&
                            <li key={user.id} className="user-item" data-userid={user.id}>
                                <span className="user-fullname">{user.fullname}</span>

                                {/* Hiển thị trạng thái online/offline */}
                                <span className={`status-indicator ${user.status_online}`}>
                                    {user.status_online == "online" ? "Online" : "Offline"}
                                </span>

                                <button onClick={() => handleCancelFriend(user.id)} className="unfriend-button">
                                    Hủy kết bạn
                                </button>
                            </li>
                        }
                    </>
                ))}
            </ul>
        </div>
    );
};

export default FriendRequest;
