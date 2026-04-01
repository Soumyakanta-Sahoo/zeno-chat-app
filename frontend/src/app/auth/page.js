"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter(); // ✅ FIX 1

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false); // ✅ FIX 2

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const url = isLogin ? "login" : "signup";

      const res = await fetch(`https://zeno-chat-app.onrender.com/${url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      // ✅ FIX 3: proper error handling
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (data._id) {
        localStorage.setItem("user", JSON.stringify(data));
        router.push("/"); // ✅ FIX 4
      }
    } catch (err) {
      console.error("Auth error:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-3">
      <h1 className="text-2xl font-bold">
        {isLogin ? "Login" : "Signup"}
      </h1>

      {!isLogin && (
        <input
          placeholder="Name"
          className="border p-2"
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />
      )}

      <input
        placeholder="Email"
        className="border p-2"
        onChange={(e) =>
          setForm({ ...form, email: e.target.value })
        }
      />

      <input
        type="password"
        placeholder="Password"
        className="border p-2"
        onChange={(e) =>
          setForm({ ...form, password: e.target.value })
        }
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`px-4 py-2 text-white rounded ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {loading
          ? "Please wait..."
          : isLogin
          ? "Login"
          : "Signup"}
      </button>

      <p
        className="cursor-pointer text-blue-500"
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin
          ? "Create account"
          : "Already have account?"}
      </p>
    </div>
  );
}