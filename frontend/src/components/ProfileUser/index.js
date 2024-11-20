import React, { useContext, useEffect, useState } from 'react';
import { jwtDecode as jwt_decode } from "jwt-decode";
import io from 'socket.io-client';
import { Link , useParams } from 'react-router-dom'
import AuthContext from '../../context/AuthContext'

import ISO6391 from 'iso-639-1';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000';

const ProfileUserpage = () => {
    const { logoutUser } = useContext(AuthContext)
    const token = localStorage.getItem("authTokens");
    const decoded = jwt_decode(token)
    const user_id = decoded.user_id
    const [socket, setSocket] = useState(null);
    const [profileUser, setProfileUser] = useState([null])
    const receiver = useParams();

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
        newSocket.emit('get_profile', {
            id: receiver.id,
            userCurrent: user_id,
        });
        newSocket.on('get_profile', (data) => {
            console.log("data",data)
            if (data.userCurrent == user_id) {
                setProfileUser(data);
            }
        });
        setSocket(newSocket);
        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on('user_connected', (data) => {
            console.log('User connected:', data.message);
        });
        socket.on('user_disconnected', (data) => {
            console.log('User disconnected:', data.message);
        });
        return () => {
            socket.off('user_connected');
            socket.off('user_disconnected');
        };
    }, [socket]);

    return (
        <>
            <div className="navbar-list">
                <Link to="/">
                    <i className="fas fa-inbox" /> Inbox
                </Link>
                <Link to="/profile/">
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
            <div className='container-profile-all'>
                <div className="container-profile">
                    <div className="profile-container">
                        <div className="profile-header">
                            <img className="profile-image"
                                alt="Profile picture of a man"
                                src={SOCKET_URL + profileUser.image}
                            />
                        </div>
                        <div className="profile-info">
                            <h3>{profileUser.fullname}</h3>
                            <p>{profileUser.username}</p>
                            <p id="about-me-preview">
                                {profileUser.bio}
                            </p>
                        </div>
                        <div className="social-icons">
                            <a href="#">
                                <i className="fab fa-facebook-f"></i>
                            </a>
                            <a href="#">
                                <i className="fab fa-twitter"></i>
                            </a>
                            <a href="#">
                                <i className="fab fa-google"></i>
                            </a>
                        </div>
                    </div>
                    <div className="form-container">
                        <div className="form-header">
                            <div className="form-group">
                                <label htmlFor="email">Email address</label>
                                <input 
                                    id="email"
                                    placeholder="Email"
                                    defaultValue={profileUser.email}
                                    readOnly 
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="language">Language</label>
                                <input readOnly id="language" type="text" defaultValue={ISO6391.getName(profileUser.user_language)}/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input id="username" type="text" defaultValue={profileUser.username} readOnly/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="address">Address</label>
                                <input
                                    id="address"
                                    type="text"
                                    defaultValue={profileUser.address} readOnly
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="hobbies">Hobbies</label>
                                <input id="hobbies" type="text" defaultValue={profileUser.hobbies}  readOnly/>
                            </div>
                        </div>
                        <div className="note">
                            <div className="form-group">
                                <label htmlFor="about-me">About Me</label>
                                <textarea
                                    id="about-me"
                                    rows={3}
                                    defaultValue={profileUser.bio}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
};

export default ProfileUserpage;
