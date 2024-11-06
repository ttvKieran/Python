import React, { useContext, useEffect, useState } from 'react';
import { jwtDecode as jwt_decode } from "jwt-decode";
import io from 'socket.io-client';
import { Link } from 'react-router-dom'
import './style.css'

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000';

const UserList = () => {
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

        console.log(newSocket)
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.emit('get_user_all', {
            user_id: user_id,
        });
        socket.on('get_user_all', (data) => {
            if(data.userCurrent === user_id)
                setUsers(prev => [...data.user_data]);
        });
        socket.on('server_return_accept_friend', (data) => {
            const userItem = document.querySelector(`li[data-userid="${data.sender_id}"]`);
            if (userItem) {
                userItem.remove();
            }
        })
        socket.on('server_return_cancel_friend', (data) => {
            if(data.receiver_id === user_id)
                setUsers(prev => [...prev, data.user_data])
        });
        socket.on('user_connected', (data) => {
            console.log('User connected:', data.message);
        });
        socket.on('user_disconnected', (data) => {
            console.log('User disconnected:', data.message);
        });
        return () => {
            socket.off('get_user_all')
            socket.off('get_user_all');
            socket.off('user_connected');
            socket.off('user_disconnected');
        };
    }, [socket, friendRequests]);

    const handleAddFriend = async (userId) => {
        socket.emit('send_add_friend', {
            user_id: user_id, 
            receiver_id: userId,
        });
        setFriendRequests([...friendRequests, userId]);
    };

    const handleRemoveFriend = async (userId) => {
        socket.emit('send_cancel_add_friend', {
            user_id: user_id, 
            receiver_id: userId,
        });
        // Cập nhật trạng thái để giao diện render lại
        setFriendRequests([...friendRequests, userId]);
    };

    return(
        <div className="user-list">
            <Link className="btn btn-primary m1" to="/">Trò chuyện</Link>
            <Link className="btn btn-primary m1" to="/user-list/">Danh sách người dùng</Link>
            <Link className="btn btn-primary m1" to="/friend-list/">Danh sách bạn bè</Link>
            <Link className="btn btn-primary m1" to="/friend-request">Lời mời kết bạn</Link>
            <h2>Danh sách người dùng</h2>
            <ul>
                {users.map(user => (
                    <>
                    {user.id !== user_id && !user.is_friend &&
                    <li key={user.id} className="user-item" data-userid={user.id}>
                        <span>{user.fullname}</span>
                        {user.is_sent ? (
                            <button onClick={() => handleRemoveFriend(user.id)}>Hủy</button>
                        ) : (
                            <button onClick={() => handleAddFriend(user.id)}>Kết bạn</button>
                        )}
                    </li>
                    }
                    </>
                ))}
            </ul>
        </div>
    );
};

export default UserList;
