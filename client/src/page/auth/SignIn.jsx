import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/auth-context";
import { AudioLines } from "lucide-react";
import Button from "../../components/ui/Button";
import { FcGoogle } from "react-icons/fc";
import { Loader } from "lucide-react";

function SignIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error && !e.target.value) setError("Email is required");
    else if (error && e.target.value) setError("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error && !e.target.value) setError("Password is required");
    else if (error && e.target.value) setError("");
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (isPending) return;

    setIsPending(true);
    console.log("Sending login request with:", { email, password });
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/auth/login`,
        { email, password }
        // { withCredentials: true }
      );
      console.log("Login response:", response.data);

      const { token, user } = response.data;
      if (!user || !user._id) throw new Error("Invalid user data from backend");

      setUser(user);

      const isAppleDevice = () => {
        const ua = navigator.userAgent;
        const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
        return /iPad|iPhone|iPod|Macintosh/.test(ua) && isSafari;
      };

      if (isAppleDevice() && token) {
        sessionStorage.setItem("accessToken", token);
      }

      const workspaceId = user.currentWorkspace; // Use the string directly since it's not an object
      const decodedUrl = returnUrl ? decodeURIComponent(returnUrl) : null;
      navigate(decodedUrl || `/workspace/${workspaceId || "default"}`);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Login failed";
      setError(errorMessage);
      console.error("Error during login:", err.response?.data || err.message);
    } finally {
      setIsPending(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google`;
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <AudioLines className="size-4" />
          </div>
          Opus Sync.
        </Link>
        <div className="flex flex-col gap-6">
          <div className="rounded-xl bg-white text-card-foreground shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_-4px_6px_-1px_rgba(0,0,0,0.1),4px_0_6px_-1px_rgba(0,0,0,0.1),-4px_0_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="flex flex-col space-y-1.5 p-6 text-center">
              <h3 className="font-semibold leading-none tracking-tight text-xl">
                Welcome back
              </h3>
              <p className="text-sm text-gray-500">
                Login with your Email or Google account
              </p>
            </div>
            <div className="p-6 pt-0">
              <form onSubmit={handleSignIn}>
                <div className="grid gap-6">
                  <div className="flex flex-col gap-4">
                    <Button
                      onClick={handleGoogleLogin}
                      variant="outline"
                      type="button"
                      className="w-full border-none shadow-sm"
                    >
                      <FcGoogle className="text-2xl" />
                      Login with Google
                    </Button>
                  </div>
                  <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-gray-500">
                    <span className="relative z-10 bg-white px-2 text-gray-500">
                      Or continue with
                    </span>
                  </div>
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <div className="space-y-2">
                        <label className="text-sm">Email</label>
                        <input
                          placeholder="m@example.com"
                          className="flex h-9 w-full rounded-md bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm !h-[48px]"
                          value={email}
                          onChange={handleEmailChange}
                        />
                        {error && !email && (
                          <p className="text-[0.8rem] font-medium text-destructive">
                            Email is required
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <label className="text-sm">Password</label>
                          <Link
                            to="/forgot-password" 
                            className="ml-auto text-sm  hover:text-indigo-500 underline-offset-4 hover:underline"
                          >
                            Forgot your password?
                          </Link>
                        </div>
                        <input
                          type="password"
                          className="flex h-9 w-full rounded-md bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm !h-[48px]"
                          value={password}
                          onChange={handlePasswordChange}
                        />
                        {error && !password && (
                          <p className="text-[0.8rem] font-medium text-destructive">
                            Password is required
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      disabled={isPending}
                      type="submit"
                      className="w-full bg-black text-white hover:bg-black/90"
                    >
                      {isPending && <Loader className="animate-spin mr-2" />}
                      Login
                    </Button>
                  </div>
                  <div className="text-center text-sm">
                    Don't have an account?{" "}
                    <Link to="/signup" className="underline underline-offset-4">
                      Sign up
                    </Link>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
            By clicking continue, you agree to our{" "}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
