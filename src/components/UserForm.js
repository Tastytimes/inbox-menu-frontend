import React, { useState } from "react";

function UserForm() {
  const [isSwitchOn, setIsSwitchOn] = useState(false);

  const toggleSwitch = () => {
    setIsSwitchOn((prevSwitchState) => !prevSwitchState);
  };
  return (
    <form>
      <h2 className="text-center">Add User</h2>
      <input
        type="text"
        placeholder="name"
        className="p-4 my-2 w-full text-sm bg-gray-800 rounded-lg"
      />
      <input
        type="text"
        placeholder="email"
        className="p-4 my-2 w-full text-sm bg-gray-800 rounded-lg"
      />

      <div className="mt-2">
        <label className="mr-2 text-2xl">Is Active:</label>
        <input
          type="checkbox"
          checked={isSwitchOn}
          onChange={toggleSwitch}
          className="status__inputbox ml-0 mb-5 size-6"
        />
      </div>
    </form>
  );
}

export default UserForm;
