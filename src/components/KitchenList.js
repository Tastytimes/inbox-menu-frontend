import Button from "react-bootstrap/Button";
import React from "react";
import Table from "react-bootstrap/Table";
import "./KitchenList.css";

function KitchenList({ list }) {
  const render = () => {
    return (
      <>
        {list.map((kitchen) => {
          return (
            <tr key={kitchen.id}>
              <td>{kitchen.kicthenName}</td>
              <td className={kitchen.status ? "activeList" : "in-ActiveList"}>
                {kitchen.status ? "active" : "in Active"}
              </td>
              <td>
                {" "}
                <Button variant="warning">Edit</Button>
              </td>
              <td>
                {" "}
                <Button variant="info">Reset pw</Button>
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
          <th>Kitchen Name</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>{render()}</tbody>
    </Table>
  );
}

export default KitchenList;
