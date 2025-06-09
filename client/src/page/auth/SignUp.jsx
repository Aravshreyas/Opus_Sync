import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AudioLines, Loader } from "lucide-react";
import Button from "../../components/ui/Button"; // Your Button with cva and cn
import { FcGoogle } from "react-icons/fc";
function SignUp() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (isPending) return;

    setIsPending(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/register`, {
        name,
        email,
        password,
      });
      if (response) {
    // Backend successfully created the unverified user and sent an OTP
    const userEmail = response.data.email;
    console.log("Registration successful for:", userEmail, "OTP sent.");
    
    // Navigate to the OTP verification page
    // We pass the user's email in the `state` so the OTP page knows who to verify
    navigate('/verify-otp', { state: { email: userEmail } });
  } else {
    // Handle any unexpected success responses from the backend
    setError(response.data?.message || "An unexpected error occurred.");
  }
      // const token = response.data.token;
      // const user = response.data.user;
      // console.log("Signup successful, user:", user);
      // navigate("/"); // Redirect to home or login page
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
      console.log("Error:", err.response?.data?.message || "Signup failed");
    }
    setIsPending(false);
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/auth/google`;
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Inline Logo - Single Link */}
        <Link to="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <AudioLines className="size-4" />
          </div>
          Opus Sync.
        </Link>
        <div className="flex flex-col gap-6">
          {/* Inline Card - Shadows on all four sides */}
          <div className="rounded-xl bg-white text-card-foreground shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_-4px_6px_-1px_rgba(0,0,0,0.1),4px_0_6px_-1px_rgba(0,0,0,0.1),-4px_0_6px_-1px_rgba(0,0,0,0.1)]">
            {/* Inline CardHeader */}
            <div className="flex flex-col space-y-1.5 p-6 text-center">
              {/* Inline CardTitle */}
              <h3 className="font-semibold leading-none tracking-tight text-xl">
                Create an account
              </h3>
              {/* Inline CardDescription - Grey text */}
              <p className="text-sm text-gray-500">
                Signup with your Email or Google account
              </p>
            </div>
            {/* Inline CardContent */}
            <div className="p-6 pt-0">
              <form onSubmit={handleSignUp}>
                <div className="grid gap-6">
                  <div className="flex flex-col gap-4">
                    {/* Button for Google - No outline, shadow */}
                    <Button
                      onClick={handleGoogleLogin}
                      variant="outline"
                      type="button"
                      className="w-full border-none shadow-sm"
                    >
                      {/* <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="size-4" // 16px
                      >
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg> */}
                       <FcGoogle className="text-2xl"/>
                      Signup with Google
                    </Button>
                  </div>
                  <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-gray-500">
                    {/* Divider Text - Grey text and line */}
                    <span className="relative z-10 bg-white px-2 text-gray-500">
                      Or continue with
                    </span>
                  </div>
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      {/* Inline FormField for name */}
                      <div className="space-y-2">
                        <label className="text-sm">Name</label>
                        <input
                          placeholder="John Doe"
                          className="flex h-9 w-full rounded-md bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm !h-[48px]"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                        {error && name === "" && (
                          <p className="text-[0.8rem] font-medium text-destructive">
                            Name is required
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      {/* Inline FormField for email */}
                      <div className="space-y-2">
                        <label className="text-sm">Email</label>
                        <input
                          placeholder="m@example.com"
                          className="flex h-9 w-full rounded-md bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm !h-[48px]"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        {error && email === "" && (
                          <p className="text-[0.8rem] font-medium text-destructive">
                            Email is required
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      {/* Inline FormField for password */}
                      <div className="space-y-2">
                        <label className="text-sm">Password</label>
                        <input
                          type="password"
                          className="flex h-9 w-full rounded-md bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm !h-[48px]"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        {error && password === "" && (
                          <p className="text-[0.8rem] font-medium text-destructive">
                            Password is required
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Button for Signup - Black background */}
                    <Button
                      disabled={isPending}
                      type="submit"
                      className="w-full bg-black text-white hover:bg-black/90"
                    >
                      {isPending && <Loader className="animate-spin" />}
                      Sign up
                    </Button>
                  </div>
                  <div className="text-center text-sm">
                    Already have an account?{" "}
                    <Link to="/" className="underline underline-offset-4">
                      Sign in
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

export default SignUp;