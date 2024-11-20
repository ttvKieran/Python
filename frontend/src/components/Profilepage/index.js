import React, { useContext, useEffect, useState, useRef } from 'react';
import { jwtDecode as jwt_decode } from "jwt-decode";
import io from 'socket.io-client';
import { Link } from 'react-router-dom'
import AuthContext from '../../context/AuthContext'
import './style-profile.css'

import ISO6391 from 'iso-639-1';

const LanguageSelector = ({ selectedLanguage, onLanguageChange }) => (
    <select value={selectedLanguage} onChange={onLanguageChange}>
        {ISO6391.getAllCodes().map((code) => (
            <option key={code} value={code}>
                {ISO6391.getName(code)} ({code})
            </option>
        ))}
    </select>
);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000';

const Profilepage = () => {
    const [language, setLanguage] = useState('en'); // Mặc định là tiếng Anh
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [hobbies, setHobbies] = useState('');
    const [address, setAddress] = useState('');
    const [aboutMe, setAboutMe] = useState('');
    const { logoutUser } = useContext(AuthContext)
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const fileInputRef = useRef(null);
    // lấy tài khoản đăng nhập
    const token = localStorage.getItem("authTokens");
    const decoded = jwt_decode(token)
    const user_id = decoded.user_id
    // const [loading, setLoading] = useState(true); 
    const [socket, setSocket] = useState(null);
    const [profileUser, setProfileUser] = useState([null])
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
            id: user_id,
            userCurrent: user_id,
        });
        newSocket.on('get_profile', (data) => {
            if (data.userCurrent == user_id) {
                setProfileUser(data);
                setAboutMe(data.aboutMe)
                setAddress(data.address)
                setEmail(data.email)
                setHobbies(data.hobbies)
                setUsername(data.username)
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        socket.emit('update_profile', {
            user_id: user_id,
            image: imagePreview,
            language: language,
            email: email,
            username: username,
            hobbies: hobbies,
            address: address,
            aboutMe: aboutMe,
        });
        window.location.reload();
    };
    //end update profile

    //Xử lý ảnh
    const handleImageSelect = (event) => {
        const file = event.target.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);  
                setSelectedImage(file);           
            };
            reader.readAsDataURL(file);         
        }
    };
    //end xử lý ảnh

    return (
        <>
            <div className="navbar-list">
                <Link to="/">
                    <i className="fas fa-inbox" /> Inbox
                </Link>
                <a href="#profile">
                    <i className="fas fa-user" /> Profile
                </a>
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
                            {!imagePreview &&
                                <img className="profile-image"
                                    alt="Profile picture of a man"
                                    src={SOCKET_URL + profileUser.image}
                                />
                            }
                            {imagePreview && (
                                <div className="image-preview">
                                    <img src={imagePreview} alt="Selected preview" className='profile-image' />
                                </div>
                            )}
                            <div className='edit-image-profile' onClick={() => fileInputRef.current?.click()}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-camera" viewBox="0 0 16 16" style={{ marginTop: "8px" }}>
                                    <path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4z" />
                                    <path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0" />
                                </svg>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                                style={{ display: "none" }}
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
                    <form onSubmit={handleSubmit} className="form-container">
                        <div className="form-header">
                            <div className="form-group">
                                <label htmlFor="email">Email address</label>
                                <input
                                    id="email"
                                    placeholder="Email"
                                    defaultValue={profileUser.email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="language">Language</label>
                                <LanguageSelector selectedLanguage={language} onLanguageChange={(e) => setLanguage(e.target.value)} id="language" />
                                {/* <button onClick={handleSaveLanguage}>Save</button> */}
                                <p>Current language: {ISO6391.getName(profileUser.user_language)}</p>
                                {/* <input id="language" type="text" defaultValue="Việt Nam" /> */}
                            </div>
                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input id="username" type="text" defaultValue={profileUser.username} onChange={(e) => setUsername(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="address">Address</label>
                                <input
                                    id="address"
                                    type="text"
                                    defaultValue={profileUser.address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="hobbies">Hobbies</label>
                                <input id="hobbies" type="text" defaultValue={profileUser.hobbies} onChange={(e) => setHobbies(e.target.value)} />
                            </div>
                        </div>
                        <div className="note">
                            <div className="form-group">
                                <label htmlFor="about-me">About Me</label>
                                <textarea
                                    id="about-me"
                                    rows={3}
                                    defaultValue={profileUser.bio}
                                    onChange={(e) => setAboutMe(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="update">
                            <button className="update-btn">Update Profile</button>
                        </div>
                    </form>
                </div>
            </div>

        </>
    );
};

export default Profilepage;
