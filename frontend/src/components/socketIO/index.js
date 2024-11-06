import React, { useState, useEffect, useRef } from 'react';
import * as Popper from 'https://cdn.jsdelivr.net/npm/@popperjs/core@^2/dist/esm/index.js'
import io from 'socket.io-client';
import { jwtDecode as jwt_decode } from "jwt-decode";
import { Link, useHistory, useParams } from 'react-router-dom'

import './style.css'

import { Camera, Send } from 'lucide-react';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000';

const Socketpage = () => {

    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [typing, setTyping] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const messagesEndRef = useRef(null);

    //Emoji
    const emojiPickerRef = useRef(null);
    const buttonRef = useRef(null);  // Tham chiếu tới nút button
    const tooltipRef = useRef(null); // Tham chiếu tới tooltip
    const inputRef = useRef(null);
    //End Emoji

    //Upload file ảnh
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const fileInputRef = useRef(null);

    //Lấy token
    const token = localStorage.getItem("authTokens");
    const decoded = jwt_decode(token)
    const user_id = decoded.user_id

    //Lấy từ Params 
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

        newSocket.emit('get_message_all', {
            sender_id: user_id,
            receiver_id: receiver.id,
        });
        newSocket.on('get_message_all', (data) => {
            setMessages(prev => [...prev, ...data]);
        });

        // console.log(newSocket)
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on('chat_message', (data) => {
            setMessages(prev => {
                return [...prev, {
                    ...data,
                    isCurrentUser: data.user_id === currentUser?.user_id
                }];
            });
        });
        socket.on('typing', (data) => {
            setTyping(prev => [...prev, data.user]);
        });

        socket.on('stop_typing', (data) => {
            setTyping(prev => prev.filter(user => user !== data.user));
        });
        socket.on('user_connected', (data) => {
            console.log('User connected:', data.message);
        });
        socket.on('user_disconnected', (data) => {
            console.log('User disconnected:', data.message);
        });
        return () => {
            socket.off('chat_message');
            socket.off('typing');
            socket.off('stop_typing');
            socket.off('user_connected');
            socket.off('user_disconnected');
        };
    }, [socket]);

    //Xử lý thanh scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    //Xử lý upload file ảnh
    const handleImageSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedImage(file);

            // Tạo preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Gửi tin nhắn
    const handleSubmit = (e) => {
        e.preventDefault();
        if((message.trim() || selectedImage) && socket) {
            console.log(message)
            console.log(imagePreview)
            socket.emit('chat_message', {
                message: message.trim(),
                timestamp: new Date().toISOString(),
                sender_id: user_id,
                receiver_id: receiver.id,
                image: imagePreview,
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

        if (e.target.value.length > 0) {
            socket.emit('typing', {});
        } else {
            socket.emit('stop_typing', {});
        }
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
        // Tạo Popper khi button và tooltip đã tồn tại
        if (buttonRef.current && tooltipRef.current) {
            Popper.createPopper(buttonRef.current, tooltipRef.current, {
                placement: 'top', // Ví dụ: tooltip sẽ xuất hiện ở phía trên của nút
            });
        }
    }, []); // Chỉ chạy 1 lần khi component render
    const toggleTooltip = () => {
        tooltipRef.current.classList.toggle('shown'); // Bật/tắt tooltip
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
    }, [message]); // Đảm bảo rằng message được cập nhật đúng cách
    //End Xử lý Emoji

    return (
        <div className="flex flex-col h-screen max-w-2xl mx-auto p-4" >
            <Link className="btn btn-primary m1">Danh sách người dùng</Link>
            <Link className="btn btn-primary m1">Danh sách bạn bè</Link>
            <Link className="btn btn-primary m1">Lời mời kết bạn</Link>
            <div className="flex-1 overflow-y-auto mb-4 p-4 border rounded-lg bg-gray-50">
                {/* <div className="space-y-4"> */}
                <>
                    {messages.map((m, index) => (
                        <>
                            {m.sender_id == receiver.id && m.receiver_id == user_id &&
                                <div className="chat-message-left pb-4" key={index}>
                                    <div>
                                        <img src={m.sender_image} className="profile-image" alt="Chris Wood" style={{ objectFit: "cover" }} width={40} height={40} />
                                        {/* <div className="text-muted small text-nowrap mt-2">
                                <span className='mt-3'>{moment.utc(m.timestamp).local().startOf('seconds').fromNow()}</span>
                              </div> */}
                                    </div>
                                    <div className="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
                                        <div className="font-weight-bold mb-1">{m.sender_fullname}</div>
                                        {/* {m.content} */}
                                        <div class="message-container">
                                            <p class="message-text">{m.content}</p>
                                        </div>
                                        <br />
                                        {(m.image_url && m.image_url!="/media/default.jpg") && (
                                            <img
                                                src={SOCKET_URL + m.image_url}
                                                alt="Message attachment"
                                                className="mt-2 max-w-xs rounded-lg"
                                            />
                                        )}
                                    </div>
                                </div>
                            }
                            {m.sender_id == user_id && m.receiver_id == receiver.id &&
                                <div className="chat-message-right pb-4" key={index}>
                                    <div>
                                        <img src={m.sender_image} className="profile-image" alt="{message.reciever_profile.full_name}" style={{ objectFit: "cover" }} width={40} height={40} />
                                        <br />
                                        {/* <div className="text-muted small text-nowrap mt-2">{moment.utc(m.timestamp).local().startOf('seconds').fromNow()}</div> */}
                                    </div>
                                    <div className="flex-shrink-1 bg-light rounded py-2 px-3 ml-3">
                                        <div className="font-weight-bold mb-1">You</div>
                                        <div class="message-container">
                                            <p class="message-text">{m.content}</p>
                                        </div>
                                        {(m.image_url && m.image_url!="/media/default.jpg") && (
                                            <img
                                                src={SOCKET_URL + m.image_url}
                                                alt="Message attachment"
                                                className="mt-2 max-w-xs rounded-lg"
                                            />
                                        )}
                                    </div>
                                </div>
                            }
                            {/* <div key={index}>Không tải lên được</div> */}
                        </>
                    ))}
                    {typing.length > 0 && (
                        <div className="text-gray-500 italic">
                            {typing.length === 1
                                ? 'Someone is typing...'
                                : `${typing.length} people are typing...`}
                        </div>
                    )}
                </>
                <div ref={messagesEndRef} />
                {/* </div> */}
            </div>
            {/* Preview ảnh đã chọn */}
            {imagePreview && (
                <div className="mb-4">
                    <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-32 rounded-lg"
                    />
                    <button
                        onClick={() => {
                            setSelectedImage(null);
                            setImagePreview('');
                            if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                            }
                        }}
                        className="mt-2 px-3 py-1 text-sm text-red-600 hover:text-red-700"
                    >
                        Remove
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={message}
                        ref={inputRef}
                        id='input-chat'
                        onChange={handleTyping}
                        className="flex-1 p-2 border rounded"
                        placeholder="Type a message..."
                    />
                    {/* Upload image button */}
                    <button
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
                    />
                    <button
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
                    </>
                </div>
            </form>
        </div>
    );
};

export default Socketpage;

