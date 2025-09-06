import React, { useContext, useEffect, useState } from 'react';
import { jwtDecode as jwt_decode } from "jwt-decode";
import AuthContext from '../../context/AuthContext'
import io from 'socket.io-client';
import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom/cjs/react-router-dom.min';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000';
const UserList = () => {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const token = localStorage.getItem("authTokens");
    const decoded = jwt_decode(token)
    const user_id = decoded.user_id
    const [users, setUsers] = useState([]);    // danh sách người dùng
    // const [loading, setLoading] = useState(true); 
    const [socket, setSocket] = useState(null);

    const roomChatId = useParams()
    console.log(roomChatId.id)
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
        });
        setSocket(newSocket);
        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (!socket) return;
        // Nhận tin nhắn từ phòng
        socket.on("receive_message_test", (data) => {
            setMessages((prevMessages) => [...prevMessages, data.message]);
        });
        socket.on('connect', () => {
            // console.log('User connected:', data.message);
            socket.emit("join_room", { room_chat_id: roomChatId.id });
        });
        socket.on('user_disconnected', (data) => {
            console.log('User disconnected:', data.message);
        });
        return () => {
            socket.off('user_connected');
            socket.off('user_disconnected');
        };
    }, [socket, roomChatId.id]);

    const sendMessage = (e) => {
        if (socket) {
            console.log(message)
            socket.emit('send_message_test', {
                message: message.trim(),
                timestamp: new Date().toISOString(),
                room_chat_id: roomChatId.id,
            });
            setMessage('');
        }
    };

    return (
        <>
            <div>
                <h2>Room: {roomChatId.id}</h2>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message"
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </>
    );
};

export default UserList;
