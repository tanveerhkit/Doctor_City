import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RequireAdmin = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setIsAdmin(false);
      return;
    }

    setIsAdmin(user?.role === "admin");
  }, [isLoaded, isSignedIn, user]);

  if (isAdmin === null) {
    return null;
  }

  return isAdmin ? children : <Navigate to="/login" replace />;
};

export default RequireAdmin;
