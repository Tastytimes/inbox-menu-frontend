import React from "react";
// import { useSelector } from "react-redux";

function Header() {
  // const store = useSelector((store) => store.auth);
  return (
    <div className="absolute px-8 py-2 bg-gradient-to-b from-black z-10">
      <img
        src="https://inboxfood.in/public/uploads/settings/641bf0216f90e.png"
        alt="logo"
        className="w-56"
      />
    </div>
  );
}

export default Header;
