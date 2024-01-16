import React, { useState, useEffect } from "react";
import Login from "./Login";
import Browse from "./Browse";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  createBrowserRouter,
  useNavigate,
} from "react-router-dom";
import { RouterProvider } from "react-router-dom";
import Dashboard from "./Dashboard";
import Inventory from "./Inventory";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../store/Auth-Slice";
import KitchenList from "./KitchenList";
import Navbar from "./Navbar";
import RoleBasedNavigation from "./RoleBasedNavigation ";

const Body = () => {
  const selector = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("info"));
    if (token) {
      const obj = {
        email: token.email,
        role: token.role,
      };
      dispatch(login(obj));
      switch (token?.role) {
        case "admin":
          navigate("/admin-dashboard");
          break;
        case "kitchen":
          navigate("/seller-dashboard");
          break;
        default:
          navigate("/browse");
          break;
      }
    } else {
      navigate("/")
    }
  }, []);





  // const appRouter = createBrowserRouter([
  //   {
  //     path: "/",
  //     element: <Login />,
  //   },
  //   {
  //     path: "/browse",
  //     element: <Browse />,
  //   },
  //   {
  //     path: "/dashboard",
  //     element: <Dashboard />,
  //   },
  //   {
  //     path: "/inventory",
  //     element: <Inventory />,
  //   },
  // ]);

  return (

    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin-dashboard" element={<Dashboard />} />
      <Route path="/seller-dashboard" element={<Inventory />} />
    </Routes>
  );
};

export default Body;
