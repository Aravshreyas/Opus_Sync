import { Link, useNavigate } from "react-router-dom";
import { AudioLines } from "lucide-react";
import Button from "../../components/ui/Button"; // Your Button with cva and cn

function GoogleOAuthFailure() {
  const navigate = useNavigate();

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
        {/* Card with matching styles */}
        <div className="rounded-xl bg-white text-card-foreground shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_-4px_6px_-1px_rgba(0,0,0,0.1),4px_0_6px_-1px_rgba(0,0,0,0.1),-4px_0_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="p-6 text-center">
            <h1 className="font-semibold leading-none tracking-tight text-xl mb-2">
              Authentication Failed
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              We couldn't sign you in with Google. Please try again.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-black text-white hover:bg-black/90"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoogleOAuthFailure;