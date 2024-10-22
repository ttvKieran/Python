import React, { useContext } from 'react'
import { Link, useHistory } from 'react-router-dom'
import AuthContext from '../../context/AuthContext'

function Login() {
  const {loginUser} = useContext(AuthContext)
  const history = useHistory()
  const handleSubmit = async e => {
    e.preventDefault()
    const email = e.target.email.value
    const password = e.target.password.value
    email.length > 0 && loginUser(email, password)
    
    // console.log(email)
    // console.log(password)

    // if (email.length > 0) {
    //   try {
    //     // Giả sử loginUser trả về Promise
    //     await loginUser(email, password);
        
    //     // Sau khi login thành công, chuyển hướng tới dashboard
    //     NavLink('/dashboard'); // nếu dùng React Router
    //     // hoặc
    //     // router.push('/dashboard'); // nếu dùng Next.js
        
    //   } catch (error) {
    //     console.error('Login error:', error);
    //     // Xử lý lỗi nếu cần
    //   }
    // }

  }

  return (
    <>
      <main className="main-content  mt-0">
        <section>
          <div className="page-header min-vh-100">
            <div className="container">
              <div className="row">
                <div className="col-xl-4 col-lg-5 col-md-7 d-flex flex-column mx-lg-0 mx-auto">
                  <div className="card card-plain">
                    <div className="card-header pb-0 text-start">
                      <h4 className="font-weight-bolder">Sign In</h4>
                      <p className="mb-0">
                        Enter your email and password to sign in
                      </p>
                    </div>
                    <div className="card-body">
                      <form role="form" onSubmit={handleSubmit}>
                        <div className="mb-3">
                          <input
                            type="email"
                            className="form-control form-control-lg"
                            name='email'
                            placeholder="Email"
                            aria-label="Email"
                          />
                        </div>
                        <div className="mb-3">
                          <input
                            type="password"
                            className="form-control form-control-lg"
                            name='password'
                            placeholder="Password"
                            aria-label="Password"
                          />
                        </div>
                        <div className="text-center">
                          <button
                            type="submit"
                            className="btn btn-lg btn-primary btn-lg w-100 mt-4 mb-0"
                            style={{backgroundColor: "#0A0A0C", fontSize: 18}}
                          >
                            Sign in
                          </button>
                        </div>
                      </form>
                    </div>
                    <div className="card-footer text-center pt-0 px-lg-2 px-1" >
                      <p className="mb-4 text-sm mx-auto">
                        Don't have an account?
                        <Link to="/register"
                          // className="text-primary text-gradient font-weight-bold"
                          style={{color: "#0A0A0C"}}
                        >
                          Sign up
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-6 d-lg-flex d-none h-100 my-auto pe-0 position-absolute top-0 end-0 text-center justify-content-center flex-column">
                  <div
                    className="position-relative bg-gradient-primary h-100 m-3 px-7 border-radius-lg d-flex flex-column justify-content-center overflow-hidden"
                    style={{
                      backgroundImage:
                        'url("https://img.freepik.com/premium-vector/customer-support-flat-design-illustration_1149263-16010.jpg?w=740")',
                      backgroundSize: "cover"
                    }}
                  >
                    <span className="" />
                    <h4 className="mt-5 text-white font-weight-bolder position-relative">
                      {/* "Attention is the new currency" */}
                    </h4>
                    <p className="text-white position-relative">
                      {/* The more effortless the writing looks, the more effort the
                      writer actually put into the process. */}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default Login