import React, { useState, useEffect, useRef, useContext } from 'react';
import AuthContext from '../../context/AuthContext'
import * as Popper from 'https://cdn.jsdelivr.net/npm/@popperjs/core@^2/dist/esm/index.js'
import io from 'socket.io-client';
import { jwtDecode as jwt_decode } from "jwt-decode";
import { Link, useParams } from 'react-router-dom'
import moment from 'moment';
import '../assets/css/styles.css'
import { Send } from 'lucide-react';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000';

const Socketpage = () => {
    const { logoutUser } = useContext(AuthContext)
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [friends, setFriends] = useState([])
    const [profile, setProfile] = useState('')
    const [users, setUsers] = useState([])
    const messagesEndRef = useRef(null);
    const isFirstLoad = useRef(true);
    const [showMenu, setShowMenu] = useState(false);
    const functionListRef = useRef(null);
    const buttonRefTog = useRef(null);
    const emojiPickerRef = useRef(null);
    const buttonRef = useRef(null);
    const tooltipRef = useRef(null);
    const inputRef = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const fileInputRef = useRef(null);
    const token = localStorage.getItem("authTokens");
    const decoded = jwt_decode(token)
    const user_id = decoded.user_id
    const roomChatId = useParams();
    const [activeTab, setActiveTab] = useState('inbox');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [titleGroup, setTitleGroup] = useState('');
    const [groups, setGroups] = useState([]);
    const [userAll, setUserAll] = useState([]);

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
        newSocket.emit('get_messages', {
            user_id: user_id,
            room_chat_id: roomChatId.id,
        });
        newSocket.on('message_list', (data) => {
            console.log("message_list", data)
            setMessages(prev => [...data.messages]);
        });
        newSocket.emit('handle_get_profile', {
            id: roomChatId.id,
            user_id: user_id,
        });
        newSocket.emit('get_chat_list', {
            user_id: user_id,
        });
        newSocket.emit('get_search_user', {
            user_id: user_id,
        });
        setSocket(newSocket);
        return () => newSocket.close();
    }, [roomChatId]);

    useEffect(() => {
        if (!socket) return;
        socket.on('new_message', (data) => {
            console.log("new message", data);
            data.message_translated = data.message_translations[user_id]
            setMessages(prev => {
                return [...prev, { ...data, }];
            });
        });
        socket.on('chat_list', (data) => {
            setFriends(prev => {
                return [...data.chat_list];
            });
            setGroups([...data.chat_list_room]);
        });
        socket.on('connect', () => {
            socket.emit("join_room", { room_chat_id: roomChatId.id });
        });
        socket.on('profile_response', (data) => {
            console.log("profile ", data);
            setProfile(data);
        });
        socket.emit('get_user_all', {
            user_id: user_id,
        });
        socket.on('get_user_all', (data) => {
            setUserAll(prev => [...data.user_data]);
        });
        socket.on('get_search_user', (data) => {
            if (data.userCurrent == user_id)
                setUsers(prev => {
                    return [...data.user_data];
                });
        })
        socket.on('user_connected', (data) => {
            console.log('User connected:', data.message);
        });
        socket.on('user_disconnected', (data) => {
            console.log('User disconnected:', data.message);
        });
        return () => {
            socket.off('new _message');
            socket.off('profile_response');
            socket.off('profile_respone');
            socket.off('user_connected');
            socket.off('user_disconnected');
        };
    }, [socket]);

    //Xử lý thanh scroll
    const scrollToBottom = (smooth = true) => {
        // messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
        const chatMessages = document.querySelector('.chat-messages');
        chatMessages.scrollTop = chatMessages.scrollHeight; // Cuộn xuống dưới cùng
    };
    useEffect(() => {
        if (isFirstLoad.current) {
            scrollToBottom(false); // Cuộn tức thì khi mở hộp tin nhắn lần đầu
            isFirstLoad.current = false; // Đặt lại sau lần đầu tiên
        } else {
            scrollToBottom(true); // Cuộn mượt khi có tin nhắn mới
        }
    }, [messages, roomChatId]);

    //Xử lý upload file ảnh
    const handleImageSelect = (event) => {
        const file = event.target.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);  // Lưu ảnh dưới dạng URL để hiển thị
                setSelectedImage(file);            // Lưu file để có thể gửi lên server nếu cần
            };
            reader.readAsDataURL(file);          // Đọc file dưới dạng Data URL
        }
    };

    // Gửi tin nhắn
    const handleSubmit = (e) => {
        if ((message.trim() || imagePreview != null) && socket) {
            socket.emit('send_message', {
                content: message.trim(),
                timestamp: new Date().toISOString(),
                sender_id: user_id,
                image: imagePreview,
                room_chat_id: roomChatId.id,
            });
            setMessage('');
            setSelectedImage(null);
            setImagePreview('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleTyping = (e) => {
        e.preventDefault();
        setMessage(e.target.value);
        if (!socket) return;

        // if (e.target.value.length > 0) {
        //     socket.emit('typing', {});
        // } else {
        //     socket.emit('stop_typing', {});
        // }
    };

    //Xử lý phần Emoji
    // useEffect(() => {
    //     if (emojiPickerRef.current) {
    //         // Thêm sự kiện lắng nghe sau khi phần tử được render
    //         emojiPickerRef.current.addEventListener('emoji-click', event => {
    //             // console.log(event.detail); // Xử lý sự kiện emoji click
    //         });
    //     }
    //     // Dọn dẹp sự kiện khi component bị unmount
    //     return () => {
    //         if (emojiPickerRef.current) {
    //             emojiPickerRef.current.removeEventListener('emoji-click', event => {
    //                 // console.log(event.detail);
    //             });
    //         }
    //     };
    // }, []);
    useEffect(() => {
        if (buttonRef.current && tooltipRef.current) {
            Popper.createPopper(buttonRef.current, tooltipRef.current, {
                placement: 'top', // Ví dụ: tooltip sẽ xuất hiện ở phía trên của nút
            });
        }
    }, []);
    const toggleTooltip = (event) => {
        event.preventDefault();
        tooltipRef.current.classList.toggle('shown');
    };
    useEffect(() => {
        const emojiPicker = emojiPickerRef.current;
        const inputChat = inputRef.current;

        if (emojiPicker && inputChat) {
            const handleEmojiClick = (event) => {
                const icon = event.detail.unicode;

                // Lấy vị trí con trỏ hiện tại từ `inputChat`
                const cursorPosition = inputChat.selectionStart;

                // Tạo giá trị mới bằng cách chèn emoji vào vị trí con trỏ hiện tại
                const newValue =
                    message.slice(0, cursorPosition) +
                    icon +
                    message.slice(cursorPosition);

                // Cập nhật message
                setMessage(newValue);

                // Sử dụng callback trong `setMessage` để cập nhật vị trí con trỏ
                setTimeout(() => {
                    const newCursorPosition = cursorPosition + icon.length;
                    inputChat.setSelectionRange(newCursorPosition, newCursorPosition);
                }, 0);
            };

            // Gắn sự kiện emoji click
            emojiPicker.addEventListener('emoji-click', handleEmojiClick);

            // Cleanup khi component bị unmounted
            return () => {
                emojiPicker.removeEventListener('emoji-click', handleEmojiClick);
            };
        }
    }, [message]);
    //End Xử lý Emoji

    //Xử lý menu
    const handleMenuClick = (event) => {
        setShowMenu((prevShowMenu) => !prevShowMenu);
    };
    useEffect(() => {
        if (showMenu && functionListRef.current && buttonRefTog.current) {
            const buttonRect = buttonRefTog.current.getBoundingClientRect();
            const functionList = functionListRef.current;

            functionList.style.top = `${buttonRect.bottom + window.scrollY}px`;
            functionList.style.left = `${buttonRect.left + window.scrollX}px`;
        }
    }, [showMenu]);
    //End xử lý menu

    //Tìm kiếm người dùng
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([users]);
    const handleSearchChange = (event) => {
        const keyword = event.target.value;
        setSearchTerm(keyword);
        if (keyword.trim() !== '') {
            let results = friends.filter(user =>
                user.fullname.toLowerCase().includes(keyword.toLowerCase())
            );
            setFilteredUsers(results);
            results = groups.filter(group =>
                group.group_name.toLowerCase().includes(keyword.toLowerCase())
            );
            setFilteredUsers(prev => { return [...prev, ...results] });
        }
    };
    //End tìm kiếm người dùng

    // Sử dụng trạng thái để lưu trạng thái của các nút "Dịch" và "Văn bản gốc" cho từng tin nhắn
    const [showOriginalMap, setShowOriginalMap] = useState({});
    const toggleText = (messageId) => {
        // Cập nhật trạng thái chỉ cho tin nhắn được nhấn
        setShowOriginalMap((prevMap) => ({
            ...prevMap,
            [messageId]: !prevMap[messageId],
        }));
    };
    const [activeDropdownId, setActiveDropdownId] = useState(null);

    const handleRecallMessage = (messageId) => {
        socket.emit('delete_message', {
            chat_id: messageId,
        });
        setActiveDropdownId(null);
        setMessages(prevMessages =>
            prevMessages.map(message =>
                message.id === messageId
                    ? { ...message, is_deleted: true }
                    : message
            )
        );
    };

    //Modal
    const handleCreateGroupModal = () => {
        setShowCreateModal(true);
    }

    const handleCreateGroup = () => {
        socket.emit("create_group_chat", {
            user_id: user_id,
            user_ids: selectedUsers,
            group_name: titleGroup,
        });
        socket.on("group_chat_created", (data) => {
            console.log("Group Chat Created:", data);
        });
        setSelectedUsers([])
        setShowCreateModal(false);
    };

    const handleCloseModal = () => {
        setShowCreateModal(false);
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

    return (
        <>
            <div className="container-chat">
                <div className="sidebar">
                    <div className="sidebar-header">
                        <button className="menu-button" ref={buttonRefTog} onClick={handleMenuClick}>
                            <i className="fas fa-bars" style={{ fontSize: "20px" }} />
                        </button>
                        <div className="search-container">
                            <i className="fas fa-search search-icon" />
                            {/* <input className="search-input" placeholder="Search" type="text" /> */}
                            <input
                                type="text"
                                placeholder="Search for users"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="search-input"
                            />
                        </div>
                        {showMenu && (
                            <div
                                id="functionList"
                                class="function-list"
                                ref={functionListRef}
                                style={{ position: 'absolute', display: 'block' }}
                            >
                                <ul className="menu-list">
                                    <li><Link to="/profile" className="menu-link">
                                        <i className="fas fa-user" style={{ marginRight: "12px" }} /> Profile
                                    </Link></li>
                                    <li><Link className="menu-link" to="/user-list/">
                                        <i className="fas fa-address-book" style={{ marginRight: "12px" }} />User List</Link></li>
                                    <li><Link className="menu-link" to="/friend-list/">
                                        <i className="fas fa-users" style={{ marginRight: "12px" }} />Friend List</Link></li>
                                    <li><Link className="menu-link" to="/friend-request">
                                        <i className="fas fa-user-plus" style={{ marginRight: "12px" }} />Friend Request</Link></li>
                                    <li>
                                        <a className="menu-link" onClick={logoutUser} style={{ cursor: "pointer" }}>
                                            <i className="fas fa-sign-out-alt" style={{ marginRight: "12px" }} />
                                            <span>Sign Out</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                    {searchTerm === "" ? (
                        <div className="chat-list">
                            <div className="flex gap-4 bg-gray-900">
                                <div className="tabs-container">
                                    <button
                                        className={`tab-button ${activeTab === 'inbox' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('inbox')}
                                    >
                                        Inbox
                                    </button>

                                    <button
                                        className={`tab-button ${activeTab === 'community' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('community')}
                                    >
                                        Community
                                    </button>
                                </div>
                            </div>
                            {activeTab === 'inbox' && friends.map((message) =>
                                <Link key={message.id} to={'/socketIO/' + message.room_chat_id} className="chat-item">
                                    <img alt="Loading" height={50} src={SOCKET_URL + message.image} width={50} className='avatar' />
                                    {message.status_online === 'online' &&
                                        <div className="status-indicator online"></div>
                                    }
                                    <div className="chat-info">
                                        <div className="chat-name" style={{ color: "white" }}>{message.fullname}</div>
                                        <div className="chat-message">{message.latest_message_translated}</div>
                                    </div>
                                    <div className="chat-time" style={{ marginRight: "10px" }}>{moment.utc(message.latest_message_time).local().startOf('seconds').fromNow()}</div>
                                    {/* <span className={
                                        message.status_online === 'online' ? 'status-online' :
                                            message.status_online === 'offline' ? 'status-offline' :
                                                message.status_online === 'busy' ? 'status-busy' : ''
                                    }>
                                        {message.status_online}
                                    </span> */}
                                </Link>
                            )}
                            {activeTab === 'community' &&
                                <>
                                    <div className="create-button-container">
                                        <button onClick={handleCreateGroupModal} className="create-button" style={{ margin: "10px 10px" }}>
                                            Create group
                                        </button>
                                    </div>
                                    {groups.map((group) =>
                                        <Link key={group.group_id} to={'/socketIO/' + group.group_id} className="chat-item">
                                            <img alt="Loading" height={50} src={SOCKET_URL + group.group_avatar} width={50} />
                                            <div className="chat-info">
                                                <div className="chat-name" style={{ color: "white" }}>{group.group_name}</div>
                                                <div className="chat-message">{group.latest_message}</div>
                                            </div>
                                            {/* <div className="chat-time" style={{ marginRight: "10px" }}>{moment.utc(message.latest_message_time).local().startOf('seconds').fromNow()}</div> */}
                                        </Link>
                                    )}
                                </>
                            }
                        </div>
                    ) : (
                        <div className='chat-list'>
                            <div className="user-list-search">
                                {filteredUsers.map((message) =>
                                    <Link key={message.id} to={'/socketIO/' + message.room_chat_id} className="chat-item">
                                        <img alt="Loading" src={SOCKET_URL + (message.image ? message.image : message.group_avatar)} className='avatar'/>
                                        <div className="chat-info">
                                            <div className="chat-name" style={{ color: "white" }}>{message.fullname ? message.fullname : message.group_name}</div>
                                            <div className="chat-message">{message.latest_message_content}</div>
                                        </div>
                                        <div className="chat-time" style={{ marginRight: "10px" }}>{moment.utc(message.latest_message_time).local().startOf('seconds').fromNow()}</div>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )
                    }
                    {/* <div className='chat-list box1'>
                        <ul className="user-list-search">
                            {filteredUsers.map(userSearch => (
                                <li key={userSearch.id} className="user-item-search">
                                    {userSearch.fullname}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="chat-list box-2">
                        {friends.map((message) =>
                            <Link key={message.id} to={'/socketIO/' + message.id} className="chat-item">
                                <img alt="Loading" height={50} src={SOCKET_URL + message.image} width={50} />
                                <div className="chat-info">
                                    <div className="chat-name" style={{ color: "white" }}>{message.fullname}</div>
                                    <div className="chat-message">{message.latest_message_content}</div>
                                </div>
                                <div className="chat-time" style={{ marginRight: "10px" }}>{moment.utc(message.latest_message_time).local().startOf('seconds').fromNow()}</div>
                                <div className="chat-unread">5</div>
                            </Link>
                        )}
                    </div> */}
                </div>
                <div className="chat-window-page">
                    <div className="chat-header">
                        {profile.type === "private" &&
                            <>
                                <Link to={"/profile-user/" + profile.friend_id} style={{position: "relative"}}>
                                    <img
                                        alt="Profile picture"
                                        src={SOCKET_URL + profile.friend_avatar}
                                        height={40}
                                        width={40}
                                        className='avatar'
                                    />
                                    {profile.friend_status === 'online' &&
                                        <div className="status-indicator online" style={{bottom: "1px", right: "12px"}}></div>
                                    }
                                </Link>
                                <div className="chat-name">
                                    <div className="name">{profile.friend_fullname}</div>
                                    <div className="status">{profile.friend_status}</div>
                                </div>
                            </>
                        }
                        {profile.type === "group" &&
                            <>
                                {/* <Link to={"/profile-user/" + profile.friend_id}> */}
                                <img
                                    alt="Profile picture"
                                    src={SOCKET_URL + profile.room_avatar}
                                    height={40}
                                    width={40}
                                />
                                {/* </Link> */}
                                <div className="chat-name">
                                    <div className="name">{profile.room_name}</div>
                                    <div className="status">{"online"}</div>
                                </div>
                            </>
                        }
                    </div>

                    <div className="chat-messages">
                        {messages.map((m, index) => (
                            <div key={index}>
                                {m.sender_id !== user_id &&
                                    <div className="messageSend" key={index}>
                                        <div className='sender_avatar' style={{ ...profile.type === "group" && { height: "100px" } }}>
                                            <img src={m.sender_image} className="avatar" alt="Loading" style={{ objectFit: "cover" }} width={50} height={50} />
                                        </div>
                                        {(m.content.trim()) && (
                                            <div className="message-content">
                                                {profile.type === "group" &&
                                                    <>
                                                        <p>{m.sender}</p>
                                                    </>
                                                }
                                                {m.content.trim() && !m.is_deleted && (
                                                    <div className="text-container">
                                                        <div className="text">
                                                            {showOriginalMap[m.id] || m.message_translated === "<django.db.models.fields.TextField>"
                                                                ? m.content
                                                                : m.message_translated}
                                                        </div>
                                                        <button className="translate-btn" onClick={() => toggleText(m.id)}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-translate" viewBox="0 0 16 16">
                                                                <path d="M4.545 6.714 4.11 8H3l1.862-5h1.284L8 8H6.833l-.435-1.286zm1.634-.736L5.5 3.956h-.049l-.679 2.022z" />
                                                                <path d="M0 2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm7.138 9.995q.289.451.63.846c-.748.575-1.673 1.001-2.768 1.292.178.217.451.635.555.867 1.125-.359 2.08-.844 2.886-1.494.777.665 1.739 1.165 2.93 1.472.133-.254.414-.673.629-.89-1.125-.253-2.057-.694-2.82-1.284.681-.747 1.222-1.651 1.621-2.757H14V8h-3v1.047h.765c-.318.844-.74 1.546-1.272 2.13a6 6 0 0 1-.415-.492 2 2 0 0 1-.94.31" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}
                                                {(m.content.trim() && m.is_deleted) &&
                                                    <div className="text" style={{ backgroundColor: "#2F2F2F", opacity: 0.7 }}><i>{m.sender} have recalled a message</i></div>
                                                }
                                            </div>
                                        )}
                                        {(m.image_url && m.image_url != "/media/default.jpg") && !m.is_deleted && (
                                            <img
                                                src={m.image_url}
                                                alt="Message attachment"
                                                className="mt-2 max-w-xs rounded-lg"
                                            />
                                        )}
                                        {(m.image_url && m.image_url != "/media/default.jpg") && m.is_deleted &&
                                            <div className="text" style={{ backgroundColor: "#2F2F2F", opacity: 0.7 }}><i>{m.sender} have recalled a message</i></div>
                                        }
                                    </div>
                                }
                                {m.sender_id === user_id &&
                                    <>
                                        <div className="message sent" key={index} style={{ marginRight: "10px" }}>
                                            <div style={{ position: 'relative', display: 'inline-block' }}> {/* Thêm display: inline-block */}
                                                {!m.is_deleted &&
                                                    <button
                                                        className='translate-btn-sender'
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveDropdownId(activeDropdownId === m.id ? null : m.id);
                                                        }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512" width="20" height="16">
                                                            <path fill="#ffffff" d="M64 360a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm0-160a56 56 0 1 0 0 112 56 56 0 1 0 0-112zM120 96A56 56 0 1 0 8 96a56 56 0 1 0 112 0z" />
                                                        </svg>
                                                    </button>
                                                }
                                                {activeDropdownId === m.id && (
                                                    <div className="dropdown-menu" >
                                                        <button
                                                            className="dropdown-item" style={{ color: "white", fontSize: "12px", fontWeight: "600" }}
                                                            onClick={() => handleRecallMessage(m.id)}
                                                        >
                                                            Thu hồi tin nhắn
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {(m.content.trim() && !m.is_deleted) && (
                                                <div className="text">{m.content}</div>
                                            )}
                                            {(m.content.trim() && m.is_deleted) &&
                                                <div className="text" style={{ backgroundColor: "#2F2F2F", opacity: 0.7 }}><i>You have recalled a message</i></div>
                                            }
                                            <br></br>
                                            {(m.image_url && m.image_url != "/media/default.jpg") && !m.is_deleted && (
                                                <img
                                                    src={m.image_url}
                                                    alt="Message attachment"
                                                    className="mt-2 max-w-xs rounded-lg"
                                                />
                                            )}
                                            {(m.image_url && m.image_url != "/media/default.jpg") && m.is_deleted &&
                                                <div className="text" style={{ backgroundColor: "#2F2F2F", opacity: 0.7 }}><i>You have recalled a message</i></div>
                                            }
                                            {/* <div className="flex-shrink-1 bg-light rounded py-2 px-3 ml-3">
                                            <div className="font-weight-bold mb-1">You</div>
                                            <div class="message-container">
                                                <p class="message-text">{m.content}</p>
                                            </div>
                                            {(m.image_url && m.image_url != "/media/default.jpg") && (
                                                <img
                                                    src={SOCKET_URL + m.image_url}
                                                    alt="Message attachment"
                                                    className="mt-2 max-w-xs rounded-lg"
                                                />
                                            )}
                                        </div> */}
                                        </div>
                                    </>

                                }
                                <div ref={messagesEndRef} />
                            </div>
                        ))}
                    </div>

                    {/* <div className="chat-input">
                        <button
                            className="attach-button"
                            style={{ backgroundColor: "transparent", border: "none" }}
                        >
                            <i className="fas fa-image" />
                        </button>
                        <button
                            className="emoji-button"
                            style={{ backgroundColor: "transparent", border: "none" }}
                        >
                            <i className="fas fa-smile" />
                        </button>
                        <input placeholder="Message" type="text" />
                        <button
                            className="send-button"
                            style={{ backgroundColor: "purple", color: "white" }}
                        >
                            Send
                        </button>
                    </div> */}
                    {imagePreview && (
                        <div className="image-preview">
                            <img src={imagePreview} alt="Selected preview" style={{ maxWidth: "100px", maxHeight: "100px" }} />
                        </div>
                    )}
                    <div>
                        <div className="chat-input">
                            <input
                                type="text"
                                value={message}
                                ref={inputRef}
                                id='input-chat'
                                onChange={handleTyping}
                                placeholder="Aa"
                            />
                            <button
                                ref={buttonRef} onClick={toggleTooltip} type='button'
                                className="emoji-button"
                                style={{ backgroundColor: "transparent", border: "none" }}
                            >
                                <i className="fas fa-smile" />
                                <div className="tooltip" role="tooltip" ref={tooltipRef}>
                                    <emoji-picker ref={emojiPickerRef}></emoji-picker>
                                </div>
                            </button>
                            <button
                                className="attach-button"
                                style={{ backgroundColor: "transparent", border: "none" }}
                                onClick={() => fileInputRef.current?.click()}
                                type='button'
                            >
                                <i className="fas fa-image" />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                                // onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                                style={{ display: "none" }}
                            />
                            <button
                                className="send-button"
                                onClick={handleSubmit}
                                type='button'
                                style={{ backgroundColor: "purple", color: "white" }}
                            >
                                <Send size={15} />
                            </button>
                            {/* Upload image button */}
                            {/* <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-3 text-gray-600 hover:text-gray-800 bg-gray-100 rounded-lg"
                            >
                                <Camera size={24} />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                            /> */}
                            {/* <button
                                type="submit"
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                disabled={!message.trim()}
                            >
                                <Send size={24} />
                            </button>
                            <>
                                <button ref={buttonRef} onClick={toggleTooltip} type='button'>
                                    Click me
                                </button>
                                <div className="tooltip" role="tooltip" ref={tooltipRef}>
                                    <emoji-picker ref={emojiPickerRef}></emoji-picker>
                                </div>
                            </> */}
                        </div>
                    </div>
                </div>
                {showCreateModal && (
                    <div className="modal">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>Create group</h3>
                            </div>
                            <div className="modal-body">
                                <input
                                    type="text"
                                    placeholder="Group name"
                                    className="group-name-input"
                                    value={titleGroup}
                                    onChange={(e) => setTitleGroup(e.target.value)}
                                />
                                <div className="user-list">
                                    {userAll.map((user, index) => (
                                        user.id !== user_id && 
                                            <div key={user.id} className="user-item">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(user.id)}
                                                    onChange={() => handleCheckboxChange(user.id)}
                                                />
                                                <img src={SOCKET_URL+user.imgage} className="user-avatar"></img>
                                                <span className="user-name">{user.fullname}</span>
                                            </label>
                                        </div>
                                        
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="cancel-button" onClick={handleCloseModal}>
                                    Hủy
                                </button>
                                <button className="create-button" disabled={!selectedUsers.length || !titleGroup} onClick={() => { handleCreateGroup(); }}>
                                    Tạo nhóm
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
export default Socketpage;

