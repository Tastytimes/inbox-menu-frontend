import React, { useState, useRef } from "react";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import { json, useNavigate } from "react-router-dom";

import Header from "./Header";
import { checkValidData } from "../utills/Validate";
import { axiosInstance } from "../api/baseUrl";
import { useDispatch, useSelector } from "react-redux";
import apiCall from "../api/userApi";
import { login } from "../store/Auth-Slice";

const Login = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const nameRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorApiMessage, setErrorApiMessage] = useState("");
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const role = useSelector((store) => store.auth.role);

  const toggleForm = () => {
    console.log("a");
    setIsSignIn(!isSignIn);
  };

  const formSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("aa");
      const email = emailRef.current.value;
      const password = passwordRef.current.value;
      // const name = nameRef.current.value;
      const validation = checkValidData(email, password);
      setErrorMessage(validation);
      if (!validation) {
        console.log(role);
        setIsLoading(true);
        const data = {
          email: email,
          password: password,
        };
        const resp = await apiCall.login(data);
        console.log(resp.data?.data);
        const localData = {
          email: resp.data?.data?.email,
          role: resp.data?.data?.role,
          token: resp.data?.data?.token,
        };
        dispatch(login(localData));
        localStorage.setItem("info", JSON.stringify(localData));
        if (resp.data?.data?.role === "admin") {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      console.log(err.response);
      setIsError(true);
      setIsLoading(false);
      setErrorApiMessage(err.response?.data?.message);
      setTimeout(() => {
        setIsError(false);
        setErrorApiMessage("");
      }, 3000);
    }
  };

  return (
    <div>
      <Header />
      <div>
        <img
          src="https://inboxfood.in/public/uploads/images/22-03-2023/641ac70067385.png"
          alt="background"
          className="absolute"
        />

        <form
          className="bg-black absolute  p-12  mt-72 mx-auto right-0 left-0 text-white bg-opacity-45"
          onSubmit={formSubmit}
        >
          {isError && (
            <Alert key="danger" variant="danger">
              {errorApiMessage}
            </Alert>
          )}
          <h1 className="font-bold text-3xl py-10 pl-7 text-[#f17e21]">
            Welcome to Inbox
          </h1>
          <input
            type="text"
            placeholder="email"
            className="p-4 my-2 w-full text-sm bg-gray-800 rounded-lg"
            ref={emailRef}
          />
          {!isSignIn && (
            <input
              type="text"
              placeholder="name"
              className="p-4 my-2 w-full text-sm bg-gray-800 rounded-lg"
              ref={nameRef}
            />
          )}
          <input
            type="password"
            placeholder="Password"
            className="p-4 my-2 w-full text-sm bg-gray-800 rounded-lg"
            ref={passwordRef}
          />
          <p className="text-red-600  px-4">{errorMessage}</p>
          <button className="p-4 my-2 bg-red-700 w-full" type="submit">
            {" "}
            {isLoading ? (
              <Spinner animation="grow" variant="primary" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
