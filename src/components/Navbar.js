import React from "react";
import Nav from "react-bootstrap/Nav";
import { Link, NavLink } from "react-router-dom";

function Navbar() {
  return (
    <Nav
      variant="pills"
      defaultActiveKey="/dashboard"
      className="justify-center mt-10 ml-10"
    >
      <Nav.Item>
        <NavLink className="nav-link" to="/dashboard">
          Dashboard
        </NavLink>
      </Nav.Item>
      <Nav.Item>
        <NavLink className="nav-link" to="/orders">
          orders
        </NavLink>
      </Nav.Item>
    </Nav>
  );
}

export default Navbar;
