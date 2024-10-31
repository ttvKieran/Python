import { React, useContext, useState, useEffect } from 'react'
import { jwtDecode as jwt_decode } from "jwt-decode";
import AuthContext from '../../context/AuthContext'
import useAxios from '../../utils/useAxios'
import { Link, useHistory, useParams } from 'react-router-dom'
import moment from 'moment'
import './style.css'

export default function MessageDetail() {

    // Get and Decode Token
    const token = localStorage.getItem("authTokens")
    const decoded = jwt_decode(token)
    const user_id = decoded.user_id
    const baseURL = 'http://127.0.0.1:8000/api'
    // Create New State
    const [messages, setMessages] = useState([])
    const axios = useAxios()

    const receiver_id = useParams()

    // useEffect(() => {
    //     try {
    //       axios.get(baseURL + '/message/' + user_id + '/')
    //     } catch (error) {
    //       console.log(error);
    //     }
    // }, [])
    
    return (
        <div>detail</div>
    )
}
