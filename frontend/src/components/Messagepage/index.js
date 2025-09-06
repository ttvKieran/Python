import { React, useContext, useState, useEffect, useRef } from 'react'
import { jwtDecode as jwt_decode } from "jwt-decode";
import AuthContext from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import moment from 'moment'
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000';

function Messagepage() {

  const { logoutUser } = useContext(AuthContext)
  const token = localStorage.getItem("authTokens");
  const decoded = jwt_decode(token)
  const user_id = decoded.user_id
  const [messages, setMessages] = useState([])
  const [groups, setGroups] = useState([])
  const [socket, setSocket] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const functionListRef = useRef(null);
  const buttonRefTog = useRef(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const [friends, setFriends] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [titleGroup, setTitleGroup] = useState('');
  const [users, setUsers] = useState([]);
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
    newSocket.emit('get_chat_list', {
      user_id: user_id,
    });
    newSocket.emit('get_search_user', {
      user_id: user_id,
    });
    setSocket(newSocket);
    console.log(newSocket)
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('chat_list', (data) => {
      setMessages(prev => {
        return [...data.chat_list];
      });
      setGroups([...data.chat_list_room]);
    });
    socket.emit('get_user_all', {
      user_id: user_id,
    });
    socket.on('get_user_all', (data) => {
      setUserAll(prev => [...data.user_data]);
    });
    socket.on('chat_list', (data) => {
      console.log(data)
      setFriends(prev => [...data.chat_list]);
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
      socket.off('user_connected');
      socket.off('user_disconnected');
    };
  }, [socket]);

  const handleMenuClick = (event) => {
    setShowMenu((prevShowMenu) => !prevShowMenu); // Toggle hiển thị hộp lựa chọn
  };

  // Sử dụng useEffect để cập nhật vị trí của menu khi nó hiển thị
  useEffect(() => {
    if (showMenu && functionListRef.current && buttonRefTog.current) {
      const buttonRect = buttonRefTog.current.getBoundingClientRect();
      const functionList = functionListRef.current;
    }
  }, [showMenu]);

  //Modal
  const handleCreateGroupModal = () => {
    setShowCreateModal(true);
  }

  const handleCreateGroup = () => {
    console.log(selectedUsers)
    console.log(titleGroup);
    socket.emit("create_group_chat", {
      user_id: user_id,
      user_ids: selectedUsers,
      group_name: titleGroup,
    });
    socket.on("group_chat_created", (data) => {
      console.log("Group Chat Created:", data);
      // Xử lý dữ liệu của nhóm được tạo ở đây (data sẽ chứa thông tin nhóm mới)
    });
    setSelectedUsers([])
    setShowCreateModal(false);
    window.location.reload();
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
  //End Modal

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

  return (
    <>
      <div className="container-chat">
        <div className="sidebar">
          <div className="sidebar-header">
            <button className="menu-button" ref={buttonRefTog} onClick={handleMenuClick} style={{ paddingTop: "4px" }}>
              <i className="fas fa-bars" style={{ fontSize: "20px" }} />
            </button>
            <div className="search-container">
              <i className="fas fa-search search-icon" />
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
                  <div className='inbox-selected'>
                  <div className='chat-avatar'>
                    <div style={{ position: "relative" }}>
                      <img alt="Loading" height={50} src={SOCKET_URL + message.image} width={50} className='avatar' />
                      {message.status_online === 'online' &&
                        <div className="status-indicator online" style={{width: "18px", height: "18px"}}></div>
                      }
                    </div>
                  </div>
                  <div className="chat-info">
                    <div className="chat-name" style={{ color: "white" }}>{message.fullname}</div>
                    <div className="chat-message">{message.latest_message_translated}</div>
                  </div>
                  <div className="chat-time" style={{ marginRight: "10px" }}>{moment.utc(message.latest_message_time).local().startOf('seconds').fromNow()}</div>
                  </div>
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
                      <div className='inbox-selected'>
                      <div className='chat-avatar'>
                        <div style={{ position: "relative" }}>
                          <img alt="Loading" height={50} src={SOCKET_URL + group.group_avatar} width={50} className='avatar' />
                        </div>
                      </div>
                      <div className="chat-info">
                        <div className="chat-name" style={{ color: "white" }}>{group.group_name}</div>
                        <div className="chat-message">{group.latest_message}</div>
                      </div>
                      </div>
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
                    <div className='inbox-selected' >
                    <img alt="Loading" src={SOCKET_URL + (message.image ? message.image : message.group_avatar)} className='avatar' />
                    <div className="chat-info">
                      <div className="chat-name" style={{ color: "white" }}>{message.fullname ? message.fullname : message.group_name}</div>
                      <div className="chat-message">{message.latest_message_content}</div>
                    </div>
                    <div className="chat-time" style={{ marginRight: "10px" }}>{moment.utc(message.latest_message_time).local().startOf('seconds').fromNow()}</div>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )
          }
        </div>
        <div className="chat-window-page">
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
                        <img src={SOCKET_URL + user.imgage} className="user-avatar"></img>
                        <span className="user-name">{user.fullname}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="cancel-button" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button className="create-button" disabled={!selectedUsers.length || !titleGroup} onClick={() => { handleCreateGroup(); }}>
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>

  )
}

export default Messagepage





