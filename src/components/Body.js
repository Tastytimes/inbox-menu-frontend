import React, { useState, useEffect } from "react";
import Login from "./Login";
import Browse from "./Browse";
import {
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

const Body = () => {
  const selector = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  // const navigate = useNavigate();

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("info"));
    if (token) {
      const obj = {
        email: token.email,
        role: token.role,
      };
      dispatch(login(obj));

      // switch (token.role) {
      //   case "admin":
      //     navigate("/dashboard");
      //     break;
      //   case "kitchen":
      //     navigate("/browse");
      //   default:
      //     navigate("/orders");
      //     break;
      // }
      // navigate();
    }
  }, [selector]);

  const PageLoadingRouting = () => (
    <Routes>
      <Route path="/" element={<Login />} />
    </Routes>
  );

  const DashboardLoading = () => (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/kitchen" element={<KitchenList />} />
    </Routes>
  );

  const Loading = ({ role }) => {
    console.log("routing", role);
    if (role === "admin") {
      return <DashboardLoading />;
    }
    if (role === "kitchen") {
      return <PageLoadingRouting />;
    }

    // You might want to handle other roles or scenarios here
    return <div>Loading...</div>;
  };

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
    <Router>
      <Loading role={selector.role} />
    </Router>
  );
};

export default Body;
