//###############################################
//    index.js メインコンポーネント
//###############################################
import React from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import App from './App';
import SignInSide from "./SignInSide";
import SignUp from "./SignUp";

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
          <Route path="/*" element={<App/>} /> 
          <Route path="/App" element={<App/>} /> 
          <Route path="/SignInSide" element={<SignInSide/>} /> 
          <Route path="/SignUp" element={<SignUp/>} /> 
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);
