import React, { useState, useEffect, useContext} from "react"
import { Link, useHistory } from 'react-router-dom'
import AuthContext from '../../context/AuthContext'

function AuthenticationPage() {
  //Xử lý phần login
  const {loginUser} = useContext(AuthContext)
  const history = useHistory()
  const handleSubmit = async e => {
    e.preventDefault()
    const email = e.target.email.value
    const password = e.target.password.value
    email.length > 0 && loginUser(email, password)
  }
  //Xử lý phần register
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")
  const {registerUser} = useContext(AuthContext)
  console.log(email);
  console.log(username);
  console.log(password);
  console.log(password2);
  const handleSubmitRegister = async e => {
    e.preventDefault()
    registerUser(email, username, password, password2)
  }
  // State quản lý hiển thị mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  
  // Quản lý hiển thị form đăng ký hoặc đăng nhập
  useEffect(() => {
    const loginAcessRegister = document.getElementById('loginAccessRegister');
    const buttonRegister = document.getElementById('loginButtonRegister');
    const buttonAccess = document.getElementById('loginButtonAccess');
    const handleRegister = () => {
        loginAcessRegister.classList.add('active');
    }
    const handleAccess = () => {
        loginAcessRegister.classList.remove('active');
    }
    buttonRegister.addEventListener('click', handleRegister);
    buttonAccess.addEventListener('click', handleAccess);
    return () => {
        buttonRegister.removeEventListener('click', handleRegister);
        buttonAccess.removeEventListener('click', handleAccess);
    }
}, []);

  // Hàm để toggle hiển thị mật khẩu
  useEffect(() => {
    const iconEye = document.getElementById('loginPassword');
    const input = document.getElementById('password');
    const handle = () => {
        input.type = input.type === 'password' ? 'text' : 'password';
        iconEye.classList.toggle('ri-eye-fill');
        iconEye.classList.toggle('ri-eye-off-fill');
    }
    iconEye.addEventListener('click', handle);
    return () => {
        iconEye.removeEventListener('click', handle);
    }
}, []);

useEffect(() => {
  const input = document.getElementById('passwordCreate');
  const iconEye = document.getElementById('loginPasswordCreate');

  const handle = () => {
      input.type = input.type === 'password' ? 'text' : 'password';
      iconEye.classList.toggle('ri-eye-fill');
      iconEye.classList.toggle('ri-eye-off-fill');
  }
  iconEye.addEventListener('click', handle);
  return () => {
      iconEye.removeEventListener('click', handle);
  }
}, []); 
    
    return (
        <>
  {/*=============== LOGIN IMAGE ===============*/}
  <svg
    className="login__blob"
    viewBox="0 0 566 840"
    xmlns="http://www.w3.org/2000/svg"
  >
    <mask id="mask0" mask-type="alpha">
      <path
        d="M342.407 73.6315C388.53 56.4007 394.378 17.3643 391.538 
      0H566V840H0C14.5385 834.991 100.266 804.436 77.2046 707.263C49.6393 
      591.11 115.306 518.927 176.468 488.873C363.385 397.026 156.98 302.824 
      167.945 179.32C173.46 117.209 284.755 95.1699 342.407 73.6315Z"
      />
    </mask>
    <g mask="url(#mask0)">
      <path
        d="M342.407 73.6315C388.53 56.4007 394.378 17.3643 391.538 
      0H566V840H0C14.5385 834.991 100.266 804.436 77.2046 707.263C49.6393 
      591.11 115.306 518.927 176.468 488.873C363.385 397.026 156.98 302.824 
      167.945 179.32C173.46 117.209 284.755 95.1699 342.407 73.6315Z"
      />
      {/* Insert your image (recommended size: 1000 x 1200) */}
      <image className="login__img" href="https://img.pikbest.com/wp/202346/interface-application-light-blue-background-showcases-3d-rendering-of-chat_9735370.jpg!sw800"
      style={{width: "auto", height: "100%"}}/>
    </g>
  </svg>
  {/*=============== LOGIN ===============*/}
  <div className="login container grid" id="loginAccessRegister">
    {/*===== LOGIN ACCESS =====*/}
    <div className="login__access">
      <h1 className="login__title">Log in to your account.</h1>
      <div className="login__area">
        <form className="login__form" onSubmit={handleSubmit}>
          <div className="login__content grid">
            <div className="login__box">
              <input
                type="email"
                id="email"
                name="email"
                required=""
                placeholder=" "
                className="login__input"
              />
              <label htmlFor="email" className="login__label">
                Email
              </label>
              <i className="ri-mail-fill login__icon" />
            </div>
            <div className="login__box">
              <input
                type="password"
                id="password"
                name="password"
                required=""
                placeholder=""
                className="login__input"
              />
              <label htmlFor="password" className="login__label">
                Password
              </label>
              <i
                className="ri-eye-off-fill login__icon login__password"
                id="loginPassword" 
              />
            </div>
          </div>
          <button type="submit" className="login__button">
            Login
          </button>
        </form>
        {/* <div className="login__social">
          <p className="login__social-title">Or login with</p>
          <div className="login__social-links">
            <a href="#" className="login__social-link">
              <img
                src="../assets/img/icon-google.svg"
                alt="image"
                className="login__social-img"
              />
            </a>
            <a href="#" className="login__social-link">
              <img
                src="../assets/img/icon-facebook.svg"
                alt="image"
                className="login__social-img"
              />
            </a>
            <a href="#" className="login__social-link">
              <img
                src="../assets/img/icon-apple.svg"
                alt="image"
                className="login__social-img"
              />
            </a>
          </div>
        </div> */}
        <p className="login__switch">
          Don't have an account?
          <button id="loginButtonRegister">Create Account</button>
        </p>
      </div>
    </div>
    {/*===== LOGIN REGISTER =====*/}
    <div className="login__register">
      <h1 className="login__title">Create new account.</h1>
      <div className="login__area">
        <form className="login__form" onSubmit={handleSubmitRegister}>
          <div className="login__content grid">
            {/* <div className="login__group grid">
              <div className="login__box">
                <input
                  type="text"
                  id="names"
                  required=""
                  placeholder=" "
                  className="login__input"
                />
                <label htmlFor="names" className="login__label">
                  Names
                </label>
                <i className="ri-id-card-fill login__icon" />
              </div>
              <div className="login__box">
                <input
                  type="text"
                  id="surnames"
                  required=""
                  placeholder=" "
                  className="login__input"
                />
                <label htmlFor="surnames" className="login__label">
                  Surnames
                </label>
                <i className="ri-id-card-fill login__icon" />
              </div>
            </div> */}
            <div className="login__box">
              <input
                type="text"
                id="username"
                name="username"
                required=""
                placeholder=" "
                className="login__input"
                onChange={e => setUsername(e.target.value)}
              />
              <label htmlFor="username" className="login__label">
                Username
              </label>
              <i className="ri-id-card-fill login__icon" />
            </div>
            <div className="login__box">
              <input
                type="email"
                id="emailCreate"
                required=""
                placeholder=" "
                className="login__input"
                onChange={e => setEmail(e.target.value)}
              />
              <label htmlFor="emailCreate" className="login__label">
                Email
              </label>
              <i className="ri-mail-fill login__icon" />
            </div>
            <div className="login__box">
              <input
                type="password"
                id="passwordCreate"
                name="password"
                required=""
                placeholder=" "
                className="login__input"
                onChange={e => setPassword(e.target.value)}
              />
              <label htmlFor="passwordCreate" className="login__label">
                Password
              </label>
              <i
                className="ri-eye-off-fill login__icon login__password"
                id="loginPasswordCreate"
              />
            </div>
            <div className="login__box">
              <input
                type="password"
                id="passwordCheck"
                name="password2"
                required=""
                placeholder=" "
                className="login__input"
                onChange={e => setPassword2(e.target.value)}
              />
              <label htmlFor="passwordCheck" className="login__label">
                Password Again
              </label>
              <i
                className="ri-eye-off-fill login__icon login__password"
                id="loginPasswordCreate"
              />
            </div>
          </div>
          <button type="submit" className="login__button">
            Create account
          </button>
        </form>
        <p className="login__switch">
          Already have an account?
          <button id="loginButtonAccess">Log In</button>
        </p>
      </div>
    </div>
  </div>
  {/*=============== MAIN JS ===============*/}
</>
    )
}

export default AuthenticationPage