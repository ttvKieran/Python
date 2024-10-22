import React from 'react'

import {BrowserRouter as Router, Route, Switch} from 'react-router-dom'
import PrivateRoute from './utils/PrivateRoute'
import { AuthProvider } from './context/AuthContext'

import Loginpage from './components/Login/index'
import Profilepage from './components/Profilepage/index'
import Registerpage from './components/Registerpage/index'

function App() {
  return(
    <Router>
      <AuthProvider>
        {/* <Navbar/> */}
        <Switch>
          <PrivateRoute component={Profilepage} path="/profile" exact />
          <Route component={Loginpage} path="/login" />
          <Route component={Registerpage} path="/register" exact />
          <PrivateRoute component={Profilepage} path="/" />
        </Switch>
      </AuthProvider>
    </Router>
  );
}
export default App;
