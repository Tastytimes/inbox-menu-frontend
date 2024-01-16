import React, { useState } from "react";
import Navbar from "./Navbar";
import Card from "react-bootstrap/Card";
import KitchenList from "./KitchenList";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import KitchenForm from "./KitchenForm";
import UserForm from "./UserForm";
import UserList from "./UserList";

function Dashboard() {
  const kitchens = [
    { id: 1, kicthenName: "abc kitchen", status: true },
    { id: 2, kicthenName: "jndjs kitchen", status: false },
    { id: 3, kicthenName: "ohu  kitchen", status: true },
    { id: 4, kicthenName: "jby kitchen", status: false },
    { id: 5, kicthenName: "rfe kitchen", status: true },
    { id: 6, kicthenName: "ktv kitchen", status: true },
  ];

  const users = [
    { id: 1, name: "asd", email: "a@a.com", role: "admin", status: true },
    { id: 2, name: "qwe", email: "a@a.com", role: "Kitchen", status: true },
    { id: 3, name: "qefs", email: "a@a.com", role: "admin", status: false },
    { id: 4, name: "rtyr", email: "a@a.com", role: "Kitchen", status: false },
    { id: 5, name: "tgf", email: "a@a.com", role: "admin", status: true },
  ];
  const [show, setShow] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showKitchenForm, setShowKitchenForm] = useState(false);

  const handleClose = () => {
    setShow(false);
    setShowKitchenForm(false);
    setShowUserForm(false);
  };
  const handleShow = () => setShow(true);

  const handleModal = (type) => {
    if (type === "kitchen") {
      setShowKitchenForm(true);
    }
    if (type === "user") {
      setShowUserForm(true);
    }
    handleShow();
  };
  return (
    <div>
      <h4 className="text-center mt-10">Welcome Admin</h4>
      <Navbar />
      <div className="mt-10 mx-4">
        <Card>
          <Card.Body>
            <div className="flex  border-b-4">
              <h5 className="flex-1 pl-2">Kitchens</h5>
              <Button
                variant="primary"
                className="mb-3"
                onClick={() => handleModal("kitchen")}
              >
                Add Kitchen
              </Button>
            </div>
            <div>
              <KitchenList list={kitchens} />
            </div>
          </Card.Body>
        </Card>
      </div>
      <div className="mt-10 mx-4">
        <Card>
          <Card.Body>
            <div className="flex  border-b-4">
              <h5 className="flex-1 pl-2">Users</h5>
              <Button
                variant="primary"
                className="mb-3"
                onClick={() => handleModal("user")}
              >
                Add Users
              </Button>
            </div>
            <div>
              <UserList users={users} />
            </div>
          </Card.Body>
        </Card>
      </div>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          {/* <Modal.Title>Modal heading</Modal.Title> */}
        </Modal.Header>
        <Modal.Body>
          {showKitchenForm && <KitchenForm />}
          {showUserForm && <UserForm />}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleClose}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Dashboard;
