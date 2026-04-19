"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  const API = process.env.NEXT_PUBLIC_API_URL;

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (!API) return;

    fetch(`${API}/`).catch(() => {});
  }, [API]);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (!form.email || !form.password) {
      setError("Email and password are required");
      return;
    }

    if (!isLogin && !form.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!API) {
      setError("API URL missing");
      return;
    }

    setLoading(true);
    setError("");

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 10000);

    try {
      const endpoint = isLogin ? "login" : "signup";

      const res = await fetch(`${API}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data));
      router.push("/");
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Server taking too long. Try again.");
      } else {
        setError("Unable to connect.");
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-4">
      <h1 className="text-3xl font-bold">
        {isLogin ? "Login" : "Signup"}
      </h1>

      {error && (
        <p className="text-red-500 text-sm text-center">
          {error}
        </p>
      )}

      {!isLogin && (
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          className="border p-2 rounded w-full max-w-sm"
          onChange={(e) =>
            handleChange("name", e.target.value)
          }
        />
      )}

      <input
        type="email"
        placeholder="Email"
        value={form.email}
        className="border p-2 rounded w-full max-w-sm"
        onChange={(e) =>
          handleChange("email", e.target.value)
        }
      />

      <div className="relative w-full max-w-sm">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={form.password}
          className="border p-2 rounded w-full pr-16"
          onChange={(e) =>
            handleChange("password", e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />

        <button
          type="button"
          onClick={() =>
            setShowPassword(!showPassword)
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-500"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`px-4 py-2 rounded text-white w-full max-w-sm ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {loading
          ? isLogin
            ? "Logging in..."
            : "Creating account..."
          : isLogin
          ? "Login"
          : "Signup"}
      </button>

      <p
        className="cursor-pointer text-blue-500 text-sm"
        onClick={() => {
          setError("");
          setShowPassword(false);
          setIsLogin(!isLogin);
        }}
      >
        {isLogin
          ? "Create account"
          : "Already have account?"}
      </p>
    </div>
  );
}