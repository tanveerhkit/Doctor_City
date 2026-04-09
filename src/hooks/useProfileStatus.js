import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import csrfManager from "../utils/csrfManager";

const useProfileStatus = () => {
  const { user, isSignedIn, updateUser } = useAuth();
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  const checkProfileStatus = async () => {
    if (!isSignedIn || !user?.id) {
      setProfileData(null);
      setIsProfileComplete(false);
      setIsLoading(false);
      return;
    }

    try {
      const response = await csrfManager.secureFetch("http://localhost:5000/api/profile/me");

      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("Invalid response format for profile status");
        }

        const data = await response.json();
        setProfileData(data);
        setIsProfileComplete(Boolean(data.isProfileComplete));
        updateUser({
          ...user,
          ...data,
        });
      } else if (response.status === 404 || response.status === 401 || response.status === 403) {
        setProfileData(null);
        setIsProfileComplete(false);
      } else {
        setIsProfileComplete(false);
      }
    } catch (error) {
      console.error("Error checking profile status:", error);
      setIsProfileComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkProfileStatus();
  }, [isSignedIn, user?.id]);

  return {
    isProfileComplete,
    isLoading,
    profileData,
    refetch: () => {
      setIsLoading(true);
      checkProfileStatus();
    },
  };
};

export default useProfileStatus;
