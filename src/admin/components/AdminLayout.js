import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { BRAND_LOGO, BRAND_NAME } from "../../constants/brand";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { adminRoutes } from "../../utils/routes";

const AdminLayout = () => {
  const navigate = useNavigate();
  const { name, email, role, isSuperAdmin, signOut } = useAdminAuth();

  const handleLogout = async () => {
    await signOut();
    navigate(adminRoutes.login, { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `admin-sidebar__link${isActive ? " admin-sidebar__link--active" : ""}`;

  const roleLabel =
    role === "platform_super" ? "Super admin" : role === "platform_admin" ? "Admin" : role;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <img src={BRAND_LOGO} alt={BRAND_NAME} />
          <div>
            <strong>{BRAND_NAME.toLowerCase()}</strong>
            <span>Company admin</span>
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          <NavLink to={adminRoutes.dashboard} className={linkClass} end>
            Overview
          </NavLink>
          <NavLink to={adminRoutes.hotels} className={linkClass}>
            Hotels & restaurants
          </NavLink>
          <NavLink to={adminRoutes.payments} className={linkClass}>
            Orders & payments
          </NavLink>
          <NavLink to={adminRoutes.subscriptions} className={linkClass}>
            Subscriptions
          </NavLink>
          <NavLink to={adminRoutes.subscriptionPlans} className={linkClass}>
            Subscription plans
          </NavLink>
          <NavLink to={adminRoutes.refunds} className={linkClass}>
            Refunds
          </NavLink>
          <NavLink to={adminRoutes.support} className={linkClass}>
            Customer care
          </NavLink>
          {isSuperAdmin && (
            <NavLink to={adminRoutes.users} className={linkClass}>
              Admin users
            </NavLink>
          )}
          <Link to="/" className="admin-sidebar__link">
            Public site
          </Link>
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div>{name || "Admin"}</div>
            <div>{email}</div>
            <div>{roleLabel}</div>
          </div>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
