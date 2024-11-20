import React from 'react'

import {BrowserRouter as Router, Route, Switch} from 'react-router-dom'
import PrivateRoute from './utils/PrivateRoute'
import { AuthProvider } from './context/AuthContext'
import AuthenticationPage from './components/AuthenticationPage/index'
import Messagepage from './components/Messagepage'
import Profilepage from './components/Profilepage/index'
import Socketpage from './components/socketIO/index'
import UserListpage from './components/UserList'
import FriendRequestpage from './components/FriendRequest'
import FriendListpage from './components/FriendList'
import ProfileUserpage from './components/ProfileUser'

function App() {
  return(
    <Router>
      <AuthProvider>
        <Switch>
          <PrivateRoute component={UserListpage} path="/user-list"/>
          <PrivateRoute component={FriendListpage} path="/friend-list"/>
          <PrivateRoute component={FriendRequestpage} path="/friend-request"/>
          <PrivateRoute component={Profilepage} path="/profile"></PrivateRoute>
          <PrivateRoute component={ProfileUserpage} path="/profile-user/:id"></PrivateRoute>
          <Route component={AuthenticationPage} path="/authentication"/>
          <PrivateRoute component={Socketpage} path="/socketIO/:id" />
          <PrivateRoute component={Messagepage} path="/" exact/>
        </Switch>
      </AuthProvider>
    </Router>
  );
}
export default App;
