import React, { useContext, useEffect, useState } from 'react';
import { jwtDecode as jwt_decode } from "jwt-decode";
import AuthContext from '../../context/AuthContext'
import io from 'socket.io-client';
import { Link } from 'react-router-dom'
import './style-list.css'

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000';

const UserList = () => {
    const { logoutUser } = useContext(AuthContext)
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
            console.log("data", data)
            if (data.userCurrent === user_id)
                setUsers(prev => [...data.user_data]);
        });
        socket.on('server_return_accept_friend', (data) => {
            const userItem = document.querySelector(`li[data-userid="${data.sender_id}"]`);
            if (userItem) {
                userItem.remove();
            }
        })
        socket.on('server_return_cancel_friend', (data) => {
            if (data.receiver_id === user_id)
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
                <Link to="/friend-list/">
                    <i className="fas fa-users" /> Friends List
                </Link>
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
                                {user.id !== user_id && !user.is_friend &&
                                    <div key={user.id} className="friend-card1" data-userid={user.id}>
                                        <img
                                            alt="Person"
                                            height={150}
                                            src={SOCKET_URL + user.imgage}
                                            width={150}
                                        />
                                        <span>{user.fullname}</span>
                                        {user.is_sent ? (
                                            <button style={{backgroundColor: "#4D4F50"}} onClick={() => handleRemoveFriend(user.id)}>Cancle</button>
                                        ) : (
                                            <button  onClick={() => handleAddFriend(user.id)}>Add Friend</button>
                                        )}
                                    </div>
                                }
                            </>
                        ))}
                    </div>
                </div>
            </div>
        </>

    );
};

export default UserList;
