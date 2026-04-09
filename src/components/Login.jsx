import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { motion } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import loginImage from "../assets/signup.png";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { isSignedIn, signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      toast.error("Email and password are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await signIn(formData.email, formData.password);
      toast.success("Login successful");
      navigate(user.isProfileComplete ? "/" : "/profile-setup", {
        replace: true,
      });
    } catch (error) {
      console.error("Login failed:", error);
      toast.error(error.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen items-center justify-center font-inter relative">
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden md:flex md:w-1/2 justify-center items-center bg-transparent"
      >
        <motion.img
          src={loginImage}
          alt="Login Illustration"
          className="w-full h-[80vh] object-contain drop-shadow-2xl rounded-xl"
          animate={{ y: [0, -25, 0] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="md:w-1/2 w-full flex justify-center"
      >
        <div
          className="rounded-2xl border border-green-500 bg-white/70 backdrop-blur-md p-8 shadow-2xl md:p-10 w-full max-w-md"
          style={{
            background: "rgba(34,197,94,0.15)",
            backdropFilter: "blur(10px)",
          }}
        >
          <h2 className="text-3xl font-bold text-center mb-2 text-green-700">
            Welcome Back
          </h2>
          <p className="text-center text-sm text-gray-600 mb-6">
            Sign in with your Doctor City email and password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              className="w-full rounded-lg p-3 outline-none bg-white/80 text-black border border-green-300 focus:border-green-500"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full rounded-lg p-3 outline-none bg-white/80 text-black border border-green-300 focus:border-green-500"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white rounded-lg py-2 font-medium transition"
            >
              {isSubmitting ? "Signing In..." : "Login"}
            </button>
          </form>

          <div className="text-center pt-6">
            <Link
              to="/"
              className="inline-block text-sm text-green-700 hover:underline"
            >
              ← Back to Home
            </Link>
            <p className="text-sm text-gray-600 mt-4">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="text-green-700 hover:underline font-medium">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Login;

