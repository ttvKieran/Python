import {useContext} from 'react'
import {jwtDecode as jwt_decode} from "jwt-decode";
import AuthContext from '../../context/AuthContext'
import { Link } from 'react-router-dom'

function Messagepage(){
    const {user, logoutUser} = useContext(AuthContext)
  const token = localStorage.getItem("authTokens")

  if (token){
    const decoded = jwt_decode(token) 
    var user_id = decoded.user_id
  }
    return(
        <>
        <h1>Đây là trang Message của tôi</h1>
        <div>
            <a className="nav-link " onClick={logoutUser} style={{cursor:"pointer"}}>
            <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
              <i className="ni ni-single-copy-04 text-warning text-sm opacity-10" />
            </div>
            <span className="nav-link-text ms-1">Sign Out</span>
          </a>
        </div>
        </>
    )
}

export default Messagepage