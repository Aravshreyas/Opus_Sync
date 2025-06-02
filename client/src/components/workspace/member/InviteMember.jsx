import { useState } from "react";
import { toast } from "../../hooks/use-toast";
import { CheckIcon, CopyIcon, Loader } from "lucide-react";
import PermissionsGuard from "../resuable/permission-guard";
import { Permissions } from "../../constant";

const InviteMember = () => {
  const [copied, setCopied] = useState(false);
  const inviteUrl = "https://example.com/invite/abc123"; // Mocked URL (replace with real logic)

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl).then(() => {
        setCopied(true);
        toast({
          title: "Copied",
          description: "Invite url copied to clipboard",
          variant: "success",
        });
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="flex flex-col pt-0.5 px-0">
      <h5 className="text-lg leading-[30px] font-semibold mb-1">
        Invite members to join you
      </h5>
      <p className="text-sm text-gray-500 leading-tight">
        Anyone with an invite link can join this free Workspace. You can also
        disable and create a new invite link for this Workspace at any time.
      </p>

      <PermissionsGuard showMessage requiredPermission={Permissions.ADD_MEMBER}>
        <div className="flex py-3 gap-2">
          <div className="sr-only">
            <label htmlFor="link">Link</label>
          </div>
          <input
            id="link"
            disabled={true}
            className="w-full border rounded-md p-2 bg-gray-100 cursor-not-allowed"
            value={inviteUrl}
            readOnly
          />
          <button
            className="bg-black text-white hover:bg-black/90 px-2 py-1 rounded shrink-0"
            onClick={handleCopy}
          >
            {copied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
          </button>
        </div>
      </PermissionsGuard>
    </div>
  );
};

export default InviteMember;