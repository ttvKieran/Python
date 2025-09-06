import React, { useContext, useEffect, useState, useRef } from 'react';
import { jwtDecode as jwt_decode } from "jwt-decode";
import io from 'socket.io-client';
import { Link, useParams, useNavigate } from 'react-router-dom'
import AuthContext from '../../context/AuthContext'

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000';

const EditGroupChat = () => {
    const [slogan, setSlogan] = useState('');
    const [groupName, setgroupName] = useState('');
    const [groupAvatar, setGroupAvatar] = useState(null);
    const [groupRole, setGroupRole] = useState('');

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
    const [groupData, setGroupData] = useState([null]);
    const [userAll, setUserAll] = useState([]);
    const [members, setMembers] = useState([]);
    const [adding, setAdding] = useState(false);

    const roomChatId = useParams()
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
        newSocket.emit('get_group_data', {
            user_id: user_id,
            room_chat_id: roomChatId.id
        });
        newSocket.on('get_group_data', (data) => {
            setgroupName(data.group_name);
            setSlogan(data.group_slogan)
            setGroupAvatar(data.group_image)
            setGroupRole(data.role)
        });
        setSocket(newSocket);
        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.emit('get_users_not_in_group', {
            user_id: user_id,
            room_chat_id: roomChatId.id,
        });
        socket.on('get_users_not_in_group', (data) => {
            setUserAll(prev => [...data.users]);
        });
        socket.emit("get_room_members", {
            user_id: user_id,
            room_chat_id: roomChatId.id
        })
        socket.on("get_room_members", (data) => {
            console.log("member", data)
            setMembers(data.members);
        })
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

    const handleSubmitLeave = async (e) => {
        e.preventDefault();
        socket.emit('leave_group', {
            user_id: user_id,
            room_chat_id: roomChatId.id,
        });
        window.location.href = 'http://localhost:3000';
    };
    const handleSubmitDelete = async (e) => {
        e.preventDefault();
        socket.emit('delete_group', {
            user_id: user_id,
            room_chat_id: roomChatId.id
        });
        window.location.href = 'http://localhost:3000';
    };
    const handleSubmitUpdate = async (e) => {
        e.preventDefault();
        socket.emit('update_group_data', {
            room_chat_id: roomChatId.id,
            group_name: groupName,
            group_slogan: slogan,
            image: imagePreview,
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

    //modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [titleGroup, setTitleGroup] = useState('');
    const handleCreateGroupModal = () => {
        setShowCreateModal(true);
    }

    const handleCreateGroup = () => {
        // socket.emit("create_group_chat", {
        //     user_id: user_id,
        //     user_ids: selectedUsers,
        //     group_name: titleGroup,
        // });
        // socket.on("group_chat_created", (data) => {
        //     console.log("Group Chat Created:", data);
        // });
        // setSelectedUsers([])
        // setShowCreateModal(false);
        // window.location.reload();
    };

    const handleAddMember = () => {
        console.log(selectedUsers);
        socket.emit("add_users_to_group", {
            user_ids: selectedUsers,
            room_chat_id: roomChatId.id,
        });
        window.location.reload();
    }

    const handleCloseModal = () => {
        setShowCreateModal(false);
        setAdding(false);
    };

    const handleCheckboxChange = (userId) => {
        setSelectedUsers((prevSelectedUsers) => {
            if (prevSelectedUsers.includes(userId)) {
                return prevSelectedUsers.filter((id) => id !== userId); // Bỏ chọn người dùng
            } else {
                return [...prevSelectedUsers, userId]; // Thêm vào danh sách người dùng được chọn
            }
        });
    };
    //end modal
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
            <div className='container-profile-all'>
                <div className="container-profile">
                    <div className="profile-container">
                        <div className="profile-header">
                            <div style={{ position: "relative", width: "250px", height: "250px" }}>
                                {!imagePreview &&
                                    <img className="profile-image"
                                        alt="Profile picture of a man"
                                        src={SOCKET_URL + groupAvatar}
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
                            <h3>{groupName}</h3>
                            <p id="about-me-preview">
                                {slogan}
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
                                <label htmlFor="username">Group name</label>
                                <input id="username" type="text" defaultValue={groupName} onChange={(e) => setgroupName(e.target.value)} />
                            </div>
                        </div>
                        <div className="note">
                            <div className="form-group">
                                <label htmlFor="add-member">Group Members</label>
                                <button className='add-member' onClick={handleCreateGroupModal}>
                                    <i class="fa-solid fa-address-book" style={{ marginRight: "10px" }}></i> Display
                                </button>
                            </div>
                        </div>
                        <div className="note">
                            <div className="form-group">
                                <label htmlFor="about-me">Slogan</label>
                                <textarea
                                    id="about-me"
                                    rows={3}
                                    defaultValue={slogan}
                                    onChange={(e) => setSlogan(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="update">
                            <button className="update-btn" onClick={handleSubmitLeave}>Leave Group</button>
                            {groupRole === "superadmin" &&
                                <button className="update-btn" onClick={handleSubmitDelete}>Delete Group</button>
                            }
                            <button className="update-btn" onClick={handleSubmitUpdate}>Update</button>
                        </div>
                    </div>
                </div>
            </div>
            {showCreateModal && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <i class="fa-solid fa-user-group" style={{ marginLeft: "16px", marginRight: "3px" }}></i>
                            <h2 style={{ color: "white" }}>Group Members</h2>
                        </div>
                        {adding === false &&
                            <div className="modal-body">
                            {/* <input
                                type="text"
                                placeholder="Group name"
                                className="group-name-input"
                                value={titleGroup}
                                onChange={(e) => setTitleGroup(e.target.value)}
                            /> */}
                            <div className="user-list">
                                {members.map((user, index) => (
                                    user.id !== user_id &&
                                    <div key={user.id} className="user-item">
                                        <label>
                                            {/* <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => handleCheckboxChange(user.id)}
                                            /> */}
                                            <img src={SOCKET_URL + user.image} className="user-avatar"></img>
                                            <span className="user-name">{user.fullname}</span>
                                        </label>
                                    </div>

                                ))}
                            </div>
                        </div>
                        }
                        {adding &&
                            <div className="modal-body">
                            <div className="user-list">
                                {userAll.map((user, index) => (
                                    user.id !== user_id &&
                                    <div key={user.id} className="user-item">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.user_id)}
                                                onChange={() => handleCheckboxChange(user.user_id)}
                                            />
                                            <img src={SOCKET_URL + user.image} className="user-avatar"></img>
                                            <span className="user-name">{user.fullname}</span>
                                        </label>
                                    </div>

                                ))}
                            </div>
                        </div>
                        }
                        <div className="modal-footer">
                            <button className="cancel-button" onClick={handleCloseModal}>
                                Cancel
                            </button>
                            {/* <button className="create-button" disabled={!selectedUsers.length || !titleGroup} onClick={() => { handleCreateGroup(); }}>
                                Create
                            </button> */}
                            {adding === false && 
                                <button className='create-button' onClick={() => setAdding(true)}>
                                    Add Member
                                </button>
                            }
                            {adding === true && 
                                <button className='create-button' onClick={handleAddMember} disabled={!selectedUsers.length}>
                                    <i class="fa-solid fa-plus"></i> Add
                                </button>
                            }
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EditGroupChat;
