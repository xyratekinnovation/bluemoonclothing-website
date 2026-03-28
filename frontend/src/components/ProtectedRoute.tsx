import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute() {
  const location = useLocation();
  if (!localStorage.getItem("access_token")) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

