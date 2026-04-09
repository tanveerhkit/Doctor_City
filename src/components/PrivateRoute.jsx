import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children, allowedRoles }) => {
  const { isSignedIn, user, isLoaded } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.role || "user";

  if (!allowedRoles || allowedRoles.includes(role)) {
    return children;
  }

  return <Navigate to="/login" replace />;
};

export default PrivateRoute;
