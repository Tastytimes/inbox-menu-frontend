import React, { useCallback, useEffect, useState } from "react";
import {
  createAdminUser,
  deactivateAdminUser,
  listAdminUsers,
  updateAdminUser,
} from "../api/adminApi";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { formatAdminTime } from "../utils/adminFormatters";

const AdminUsersPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listAdminUsers();
      setData(response);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load admin users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setCreating(true);
    try {
      await createAdminUser(form);
      setForm({ name: "", email: "", password: "" });
      setSuccessMessage("Admin user created.");
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create admin user.");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (admin) => {
    setUpdatingId(admin.id);
    setError("");
    setSuccessMessage("");
    try {
      if (admin.isActive) {
        await deactivateAdminUser(admin.id);
        setSuccessMessage(`${admin.email} deactivated.`);
      } else {
        await updateAdminUser(admin.id, { isActive: true });
        setSuccessMessage(`${admin.email} reactivated.`);
      }
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update admin user.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>Admin users</h1>
          <p>Super user only — manage platform admin accounts.</p>
        </div>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={loadUsers}>
          Refresh
        </button>
      </header>

      {error && <div className="admin-error">{error}</div>}
      {successMessage && <div className="admin-success">{successMessage}</div>}

      <section className="admin-card admin-section">
        <h2 className="admin-section__title">Create admin</h2>
        <form onSubmit={handleCreate} className="admin-users-form">
          <div className="admin-field">
            <label htmlFor="adminName">Name</label>
            <input
              id="adminName"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </div>
          <div className="admin-field">
            <label htmlFor="adminEmail">Email</label>
            <input
              id="adminEmail"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </div>
          <div className="admin-field">
            <label htmlFor="adminPassword">Password</label>
            <input
              id="adminPassword"
              type="password"
              minLength={6}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </div>
          <button type="submit" className="admin-btn admin-btn--primary" disabled={creating}>
            {creating ? "Creating…" : "Create admin"}
          </button>
        </form>
      </section>

      <section className="admin-section">
        <h2 className="admin-section__title">Existing admins ({data?.count ?? 0})</h2>
        {loading ? (
          <p className="admin-empty">Loading users…</p>
        ) : !data?.admins?.length ? (
          <p className="admin-empty">No admin users yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Last login</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.admins.map((admin) => (
                  <tr key={admin.id}>
                    <td>{admin.name}</td>
                    <td>{admin.email}</td>
                    <td>
                      <AdminStatusBadge
                        status={admin.isActive ? "approved" : "rejected"}
                        label={admin.isActive ? "Active" : "Inactive"}
                      />
                    </td>
                    <td>{formatAdminTime(admin.lastLoginAt)}</td>
                    <td>{formatAdminTime(admin.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost admin-btn--small"
                        disabled={updatingId === admin.id}
                        onClick={() => handleToggleActive(admin)}
                      >
                        {admin.isActive ? "Deactivate" : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
};

export default AdminUsersPage;
