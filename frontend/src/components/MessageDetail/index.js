import { React, useContext, useState, useEffect, useRef } from 'react'
import { jwtDecode as jwt_decode } from "jwt-decode";
import AuthContext from '../../context/AuthContext'
import useAxios from '../../utils/useAxios'
import { Link, useHistory, useParams } from 'react-router-dom'
import moment from 'moment'
import axiosInstance from './axiosInstance';

export default function MessageDetail() {
  // const { user, logoutUser } = useContext(AuthContext)
  // Get and Decode Token
  const token = localStorage.getItem("authTokens");
  const decoded = jwt_decode(token);
  const user_id = decoded.user_id;
  const baseURL = 'http://127.0.0.1:8000/api';

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState([]);
  const [newMessage, setNewMessage] = useState({ content: "" });
  const [user, setUser] = useState([]);
  const [profile, setProfile] = useState([])
  const [useProfile, setUserProfile] = useState([])

  const axios = useAxios();
  const receiver = useParams();

  // Load initial messages
  useEffect(() => {
    try {
      axios.get(baseURL + '/message/' + user_id + '/').then((res) => {
        setMessages(res.data);
      });
    } catch (error) {
      console.log(error);
    }
    scrollToBottom();
  }, []);

  // Load conversation history
  useEffect(() => {
    try {
      axios.get(`${baseURL}/message-detail/${user_id}/${receiver.id}/`).then((res) => {
        setMessage(res.data);
      });
    } catch (error) {
      console.log(error);
    }
    setTimeout(() => {
      scrollToBottom();
    }, 500);
  }, [user_id, receiver.id]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axiosInstance.get(baseURL + '/message-detail/' + user_id + '/' + receiver.id + '/');
        setMessage(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    let interval = setInterval(() => {
      fetchMessages();
    }, 1000);

    return () => clearInterval(interval);
  }, [user_id, receiver.id]);

  const handleChangeMessage = (event) => {
    setNewMessage({
      ...newMessage,
      [event.target.name]: event.target.value,
    });
    const input = document.getElementById('text-input-send-message');
    const button = document.getElementById('button-send-message');

    input.addEventListener('keydown', (event) => {
      if (event.keyCode === 13) {
        button.click();
      }
    });
  };

  const sendMessage = (event) => {
    event.preventDefault();

    if (!newMessage.content.trim()) return;

    // Save to database
    const formData = new FormData();
    formData.append("user", user_id);
    formData.append("sender", user_id);
    formData.append("receiver", receiver.id);
    formData.append("content", newMessage.content);
    formData.append("is_read", false);

    try {
      axios.post(baseURL + '/send-message/', formData);
      document.getElementById("text-input-send-message").value = "";
      setNewMessage({ content: '' });

    } catch (error) {
      console.log(error);
    }
    setTimeout(() => {
      scrollToBottom();
    }, 800);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let profile_id = receiver.id - 33
        console.log(profile_id)
        await axios.get(baseURL + '/profile/' + profile_id + '/').then((res) => {
          setProfile(res.data)
          setUser(res.data.user)
        })

      } catch (error) {
        console.log(error);
      }
    }
    fetchProfile()
  }, [receiver.id])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let profile_id = user_id - 33
        await axios.get(baseURL + '/profile/' + profile_id + '/').then((res) => {
          setUserProfile(res.data)
        })

      } catch (error) {
        console.log(error);
      }
    }
    fetchProfile()
  }, [])

  console.log(profile)

  function scrollToBottom() {
    const chatContainer = document.getElementById('chat-messages');
    const lastMessage = chatContainer.lastElementChild; // Phần tử cuối cùng trong khung chat

    if (lastMessage) {
      lastMessage.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <>
      <main className="content">
        {/* <div className="content p-0" > */}
        <div className="card">
          <div className="row">
            <div className="col-12 col-lg-5 col-xl-3 border-right">
              <div className="px-4 d-none d-md-block">
                <Link to={'/profile/' + user_id} className="d-flex align-items-center py-1" style={{marginTop: "10px"}}>
                  <div className="position-relative">
                    <img
                      src={useProfile.image == null ? "/default.png" : useProfile.image}
                      className="profile-image"
                      alt="Sharon Lessman"
                      width={60}
                      height={60}
                    />
                  </div>
                  <div className="flex-grow-1 pl-3" style={{color: "black"}}>
                    <strong>{useProfile.fullname}</strong>
                  </div>
                  {/* <div>
                    <button className="btn btn-light border btn-lg px-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={24}
                        height={24}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="feather feather-more-horizontal feather-lg"
                      >
                        <circle cx={12} cy={12} r={1} />
                        <circle cx={19} cy={12} r={1} />
                        <circle cx={5} cy={12} r={1} />
                      </svg>
                    </button>
                  </div> */}
                </Link>
                <div className="d-flex align-items-center">
                  {/* <div className="flex-grow-1">
                    <input
                      type="text"
                      className="form-control my-3"
                      placeholder="Search..."
                    />
                  </div> */}
                  <div className="search-container flex-grow-1">
                    <span className="search-icon">
                      <i class="fa-solid fa-magnifying-glass"></i>
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm kiếm trên Messenger"
                      className="search-input"
                    />
                  </div>
                </div>
              </div>
              {messages.map((message, index) =>
                <Link to={'/' + (message.sender === user_id ? message.receiver : message.sender) + '/'} className="list-group-item list-group-item-action border-0">
                  <small><div className="badge bg-success float-right text-white">{moment.utc(message.timestamp).local().startOf('seconds').fromNow()}</div></small>
                  <div className="d-flex align-items-start">
                    {message.sender !== user_id &&
                      <img src={message.sender_profile.image} className="profile-image" alt="1" width={60} height={60} key={index} />
                    }
                    {message.sender === user_id &&
                      <img src={message.receiver_profile.image} className="profile-image" alt="2" width={60} height={60} key={index} />
                    }
                    <div className="flex-grow-1 ml-3" style={{ fontWeight: "bold" }}>
                      {message.sender !== user_id &&
                        (message.sender_profile.fullname)
                      }
                      {message.sender === user_id &&
                        (message.receiver_profile.fullname)
                      }
                      <div className="small">
                        {message.content}
                      </div>
                    </div>
                  </div>
                </Link>
              )}
              <hr className="d-block d-lg-none mt-1 mb-0" />
            </div>
            <div className="col-12 col-lg-7 col-xl-9" style={{ borderBottom: "0" }}>
              <div className="py-2 px-4 border-bottom d-none d-lg-block" style={{ height: "12vh" }}>
                <div className="d-flex align-items-center py-1">
                  <div className="position-relative">
                    <img
                      src={profile.image == null ? "/default.png" : profile.image}
                      className="profile-image"
                      alt="Sharon Lessman"
                      width={60}
                      height={60}
                    />
                  </div>
                  <div className="flex-grow-1 pl-3">
                    <strong>{profile.fullname}</strong>
                    <div className="text-muted small">
                      <em>Online</em>
                    </div>
                  </div>
                  <div>
                    <button className="btn btn-light border btn-lg px-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={24}
                        height={24}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="feather feather-more-horizontal feather-lg"
                      >
                        <circle cx={12} cy={12} r={1} />
                        <circle cx={19} cy={12} r={1} />
                        <circle cx={5} cy={12} r={1} />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="position-relative">
                <div className="chat-messages p-4" id='chat-messages'>
                  {message.slice().reverse().map((m, index) =>
                    <>
                      {m.sender !== user_id &&
                        <div className="chat-message-left pb-4" key={index}>
                          <div>
                            <img src={m.sender_profile.image} className="profile-image" alt="Chris Wood" style={{ objectFit: "cover" }} width={40} height={40} />
                            <div className="text-muted small text-nowrap mt-2">
                              <span className='mt-3'>{moment.utc(m.timestamp).local().startOf('seconds').fromNow()}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
                            <div className="font-weight-bold mb-1">{m.sender_profile.fullname}</div>
                            {/* {m.content} */}
                            <div class="message-container">
                              <p class="message-text">{m.content}</p>
                            </div>
                            <br />
                          </div>
                        </div>
                      }
                      {m.sender === user_id &&
                        <div className="chat-message-right pb-4" key={index}>
                          <div>
                            <img src={m.sender_profile.image} className="profile-image" alt="{message.reciever_profile.full_name}" style={{ objectFit: "cover" }} width={40} height={40} />
                            <br />
                            <div className="text-muted small text-nowrap mt-2">{moment.utc(m.timestamp).local().startOf('seconds').fromNow()}</div>
                          </div>
                          <div className="flex-shrink-1 bg-light rounded py-2 px-3 ml-3">
                            <div className="font-weight-bold mb-1">You</div>
                            {m.content}
                          </div>
                        </div>
                      }

                    </>
                  )}
                </div>
              </div>
              <div className="flex-grow-0 py-3 px-4 border-top" style={{ height: "10vh", borderBottom: "0" }}>
                {/* <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type your message"
                    name='content'
                    onChange={handleChangeMessage}
                    id="text-input-send-message"
                    value={newMessage.content}
                  />
                  <button className="btn btn-4 btn-sep icon-send" id='button-send-message' onClick={sendMessage}>Send</button>
                </div> */}
                <div className="message-input-container">
                  <input type="text" placeholder="Aa" className="message-input" name='content'
                    onChange={handleChangeMessage}
                    id="text-input-send-message"
                    value={newMessage.content} />
                  <button className="emoji-button" id='button-send-message' onClick={sendMessage}>
                    <i class="fa-solid fa-face-smile"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* </div> */}
      </main>
      {/* <div>
        <a className="nav-link " onClick={logoutUser} style={{ cursor: "pointer" }}>
          <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
            <i className="ni ni-single-copy-04 text-warning text-sm opacity-10" />
          </div>
          <span className="nav-link-text ms-1">Sign Out</span>
        </a>
      </div> */}
    </>
  )
}
