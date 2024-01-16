import React from "react";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";

function UserList({ users }) {
  const render = () => {
    return (
      <>
        {users.map((user) => {
          return (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td className={user.status ? "activeList" : "in-ActiveList"}>
                {user.status ? "active" : "in Active"}
              </td>
              <td>
                {" "}
                <Button variant="warning">Edit</Button>
              </td>
            </tr>
          );
        })}
      </>
    );
  };
  return (
    <Table striped>
      <thead>
        <tr>
          <th> Name</th>
          <th> Email</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>{render()}</tbody>
    </Table>
  );
}

export default UserList;
