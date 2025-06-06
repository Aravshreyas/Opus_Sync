import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/auth-context";
import axios from "axios";
import {
  Camera,
  UserCircle,
  Trash2,
  Loader2,
  CheckCircle,
  Shield,
  Bell,
  Globe,
  Edit3,
  Save,
  XCircle,
  KeyRound,
  RotateCcw,
} from "lucide-react";
import UserAvatar from "../../components/common/UserAvatar"; // Make sure this path is correct

const AccountSettingsPage = () => {
  const { user, setUser } = useAuth();

  // State for overall profile edit mode
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // States for profile data
  const [currentName, setCurrentName] = useState("");
  const [tempDisplayName, setTempDisplayName] = useState("");
  const [email, setEmail] = useState("");

  // Picture related states for the new Cloudinary flow
  const [currentCustomPicUrl, setCurrentCustomPicUrl] = useState(null);
  const [defaultUserPicUrl, setDefaultUserPicUrl] = useState(null);
  const [newImage, setNewImage] = useState({ url: null, isUploading: false });
  const [intentToRemoveCustomPic, setIntentToRemoveCustomPic] = useState(false);

  // UI/UX states
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState("");

  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef(null);

  // Effect to populate state when user object is available or changes
  useEffect(() => {
    if (user) {
      setCurrentName(user.name || "");
      setTempDisplayName(user.name || "");
      setEmail(user.email || "");
      setCurrentCustomPicUrl(user.profilePicture || null);
      setDefaultUserPicUrl(user.defaultProfilePictureUrl || null);

      // Reset any pending image changes on user data refresh
      setNewImage({ url: null, isUploading: false });
      setIntentToRemoveCustomPic(false);
    } else {
      // Reset all states if user logs out
      setCurrentName("");
      setTempDisplayName("");
      setEmail("");
      setCurrentCustomPicUrl(null);
      setDefaultUserPicUrl(null);
      setNewImage({ url: null, isUploading: false });
      setIntentToRemoveCustomPic(false);
      setIsEditingProfile(false);
    }
  }, [user]);

  const handleDeleteProfilePicture = async () => {
    setIsDeleting(true);
    setProfileError(null);
    setProfileSuccessMessage("");

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/user/profile/picture`,
        { withCredentials: true }
      );

      const updatedUser = response.data.user;

      // Update user context and UI states
      setUser(updatedUser);
      setCurrentCustomPicUrl(updatedUser.profilePicture);
      setDefaultUserPicUrl(updatedUser.defaultProfilePictureUrl);
      setNewImage({ url: null, isUploading: false });
      setIntentToRemoveCustomPic(false);

      setProfileSuccessMessage("Profile picture deleted successfully.");
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      setProfileError("Failed to delete profile picture. Please try again.");
    } finally {
      setIsDeleting(false);
      setTimeout(() => setProfileSuccessMessage(""), 3000);
    }
  };

  // Function to upload file directly to Cloudinary
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    // IMPORTANT: Replace with your actual Cloudinary upload preset
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    );

    try {
      const response = await axios.post(
        // IMPORTANT: Replace with your actual Cloudinary cloud name
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/image/upload`,
        formData,
        { withCredentials: false }
      );
      console.log(response.data.public_id)
      return {
      url: response.data.secure_url,
      publicId: response.data.public_id,
    };
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      const errorMessage =
        error.response?.data?.error?.message ||
        "Image upload failed. Please try again.";
      throw new Error(errorMessage);
    }
  };

  // Handler for when a user selects a file from their computer
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input

    if (file) {
      // Basic client-side validation
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setProfileError("File is too large. Maximum 5MB allowed.");
        return;
      }
      if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
        setProfileError("Invalid file type. Please upload a JPG, PNG, or GIF.");
        return;
      }

      setProfileError(null);
      setNewImage({ url: null, isUploading: true }); // Show loader
      setIntentToRemoveCustomPic(false);

      try {
        const { url, publicId } = await uploadToCloudinary(file);
        setNewImage({ url,publicId, isUploading: false }); // Set the new URL
      } catch (error) {
        setProfileError(error.message);
        setNewImage({ url: null, isUploading: false }); // Reset on failure
      }
    }
  };

  // Handler to cancel a staged (but not yet saved) image upload
  const handleCancelFileSelection = () => {
    setNewImage({ url: null, isUploading: false });
    setIntentToRemoveCustomPic(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setProfileError(null);
  };

  // Handler to toggle the intent to remove an existing custom picture
  const handleToggleRemoveCustomPic = () => {
    if (intentToRemoveCustomPic) {
      setIntentToRemoveCustomPic(false);
    } else {
      // Clear any staged uploads if user decides to remove instead
      setNewImage({ url: null, isUploading: false });
      setIntentToRemoveCustomPic(true);
    }
  };

  // Programmatically clicks the hidden file input
  const triggerFileInput = () => fileInputRef.current?.click();

  // Toggles the entire profile section between view and edit mode
  const handleToggleProfileEditMode = () => {
    const newEditState = !isEditingProfile;
    setIsEditingProfile(newEditState);

    if (newEditState) {
      // Entering edit mode
      setTempDisplayName(currentName); // Sync temp name with current name
      setProfileError(null);
      setProfileSuccessMessage("");
    } else {
      // Exiting edit mode (Cancel)
      setTempDisplayName(currentName); // Reset temp name
      handleCancelFileSelection(); // Cancel any staged picture changes
      setIntentToRemoveCustomPic(false); // Reset remove intent
      setProfileError(null);
      setProfileSuccessMessage("");
    }
  };

  // Main form submission handler
  const handleProfileFormSubmit = async (e) => {
    e.preventDefault();
    setIsProfileSaving(true);
    setProfileError(null);
    setProfileSuccessMessage("");

    const payload = {};
    let actualChangesMade = false;

    // 1. Check if name was edited and is different
    if (tempDisplayName.trim() !== currentName) {
      if (!tempDisplayName.trim()) {
        setProfileError("Name cannot be empty.");
        setIsProfileSaving(false);
        return;
      }
      payload.name = tempDisplayName.trim();
      actualChangesMade = true;
    }

    // 2. Check if a new picture was uploaded
    if (newImage.url && newImage.url !== currentCustomPicUrl) {
      payload.profilePicture = newImage.url;
      console.log(newImage)
      if (newImage.publicId) {
        payload.publicId = newImage.publicId;
      }

      actualChangesMade = true;
    }
    // 3. Check if the user wants to remove the existing picture
    else if (intentToRemoveCustomPic && currentCustomPicUrl) {
      payload.removeProfilePicture = true;
      actualChangesMade = true;
    }

    if (!actualChangesMade) {
      setProfileSuccessMessage("No changes to save.");
      setIsProfileSaving(false);
      setIsEditingProfile(false); // Exit edit mode anyway
      setTimeout(() => setProfileSuccessMessage(""), 3000);
      return;
    }

    try {
      const endpoint = `${import.meta.env.VITE_BACKEND_URL}/user/profile`;
      // The payload is now a simple JSON object
      const response = await axios.put(endpoint, payload);

      if (response.data && response.data.user) {
        setUser(response.data.user); // Update global user state
        setProfileSuccessMessage("Profile updated successfully!");
        setIsEditingProfile(false); // Exit edit mode on successful save
        // The useEffect on `user` will reset component state like newImage etc.
      } else {
        throw new Error("Invalid response from server.");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to update profile.";
      setProfileError(errorMessage);
    } finally {
      setIsProfileSaving(false);
      setTimeout(() => {
        setProfileSuccessMessage("");
      }, 3000);
    }
  };

  // Loading state while waiting for user data
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        <p className="mt-4 text-gray-700">Loading user information...</p>
      </div>
    );
  }

  // Logic to determine which avatar URL to display based on current state
  let avatarDisplayUrl = null;
  if (isEditingProfile) {
    if (newImage.url) {
      avatarDisplayUrl = newImage.url; // Show newly uploaded image preview
    } else if (intentToRemoveCustomPic) {
      avatarDisplayUrl = defaultUserPicUrl; // Show default pic if removal is intended
    } else {
      avatarDisplayUrl = currentCustomPicUrl || defaultUserPicUrl; // Show existing pic
    }
  } else {
    avatarDisplayUrl = currentCustomPicUrl || defaultUserPicUrl; // Show saved pic
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Account Settings
          </h1>
          <p className="mt-2 text-md text-slate-600">
            Manage your profile, security, and application preferences.
          </p>
        </header>

        {/* --- Profile Section --- */}
        <section
          id="profile-settings"
          className="mb-12 bg-white shadow-xl rounded-lg p-6 sm:p-8"
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">My Profile</h2>
            {!isEditingProfile && (
              <button
                type="button"
                onClick={handleToggleProfileEditMode}
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                disabled={isProfileSaving}
              >
                <Edit3 size={16} /> Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleProfileFormSubmit} className="space-y-6">
            {/* --- Profile Picture Area --- */}
            <div className="flex flex-col items-center space-y-4 pb-6">
              <div className="relative group">
                <UserAvatar
                  user={{ ...user, profilePicture: avatarDisplayUrl }} // Pass the dynamic URL
                  size={20}
                  fontSizeClass="text-2xl"
                />
                {isEditingProfile && !newImage.isUploading && (
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="absolute inset-0 flex items-center justify-center bg-transparent group-hover:bg-black/60 rounded-full transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white"
                    aria-label="Change profile picture"
                    disabled={isProfileSaving || newImage.isUploading}
                  >
                    <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform group-hover:scale-110" />
                  </button>
                )}
                {newImage.isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-full">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/gif"
                className="hidden"
                disabled={
                  isProfileSaving || !isEditingProfile || newImage.isUploading
                }
              />
              {isEditingProfile && (
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="px-3 py-1.5 font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50"
                    disabled={isProfileSaving || newImage.isUploading}
                  >
                    {newImage.url ? "Change Staged" : "Upload New"}
                  </button>
                  {newImage.url && (
                    <button
                      type="button"
                      onClick={handleCancelFileSelection}
                      className="p-1.5 font-medium text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 disabled:opacity-50"
                      disabled={isProfileSaving || newImage.isUploading}
                      title="Cancel new photo selection"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                  {currentCustomPicUrl &&
                    !newImage.url &&
                    (intentToRemoveCustomPic ? (
                      <button
                        type="button"
                        onClick={handleToggleRemoveCustomPic}
                        className="px-3 py-1.5 font-medium text-amber-700 bg-amber-100 rounded-md hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-500 disabled:opacity-50"
                        disabled={isProfileSaving || newImage.isUploading}
                        title="Undo remove custom picture"
                      >
                        <RotateCcw className="inline h-3 w-3 mr-1" /> Undo
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleToggleRemoveCustomPic}
                        className="px-3 py-1.5 font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50"
                        disabled={isProfileSaving || newImage.isUploading}
                        title="Remove custom picture"
                      >
                        <Trash2 className="inline h-3 w-3 mr-1" /> Remove Custom
                      </button>
                    ))}

                  {currentCustomPicUrl && !newImage.url && !isDeleting && (
                    <button
                      type="button"
                      onClick={handleDeleteProfilePicture}
                      className="px-3 py-1.5 font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50"
                      disabled={
                        isProfileSaving || newImage.isUploading || isDeleting
                      }
                      title="Delete Profile Picture"
                    >
                      <Trash2 className="inline h-3 w-3 mr-1" /> Delete Profile
                      Picture
                    </button>
                  )}

                  {isDeleting && (
                    <div className="text-red-600 font-medium text-sm mt-2">
                      Deleting profile picture...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* --- Form Fields --- */}
            <div className="border-t border-gray-200 pt-6 space-y-6">
              <div className="space-y-1">
                <label
                  htmlFor="profileName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    name="name"
                    id="profileName"
                    className="block w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50"
                    value={tempDisplayName}
                    onChange={(e) => setTempDisplayName(e.target.value)}
                    disabled={isProfileSaving}
                    autoFocus
                  />
                ) : (
                  <div className="min-h-[40px] px-3 py-2 text-gray-900 sm:text-sm flex items-center rounded-md border border-gray-300 bg-gray-50">
                    {currentName || (
                      <span className="italic text-gray-400">Not set</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="profileEmail"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <div className="min-h-[40px] px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 sm:text-sm flex items-center">
                  {email}
                </div>
              </div>

              {profileError && (
                <p className="text-sm text-red-600 text-center">
                  {profileError}
                </p>
              )}
              {profileSuccessMessage && (
                <p className="text-sm text-green-600 text-center flex items-center justify-center">
                  <CheckCircle size={16} className="mr-1.5" />{" "}
                  {profileSuccessMessage}
                </p>
              )}

              {isEditingProfile && (
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button
                    type="button"
                    onClick={handleToggleProfileEditMode}
                    disabled={isProfileSaving}
                    className="w-full sm:w-auto order-2 sm:order-1 inline-flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProfileSaving || newImage.isUploading}
                    className="w-full sm:w-auto order-1 sm:order-2 inline-flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isProfileSaving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-1.5" /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </form>
        </section>

        {/* --- Security Section (Placeholder) --- */}
        <section
          id="security-settings"
          className="mb-12 bg-white shadow-xl rounded-lg p-6 sm:p-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-4">
            <Shield size={20} className="inline mr-2.5 -mt-0.5 text-gray-500" />{" "}
            Security
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-medium text-gray-800">
                Change Password
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Choose a strong password and don't reuse it for other accounts.
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                <KeyRound size={16} className="mr-1" /> Change Password
              </button>
            </div>
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-md font-medium text-red-600">
                Delete Account
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Permanently remove your Personal Account and all of its
                contents. This action is not reversible, so please continue with
                caution.
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} className="mr-1" /> Delete My Account
              </button>
            </div>
          </div>
        </section>

        {/* --- Preferences Section (Placeholder) --- */}
        <section
          id="preferences-settings"
          className="mb-12 bg-white shadow-xl rounded-lg p-6 sm:p-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-4">
            <Globe size={20} className="inline mr-2.5 -mt-0.5 text-gray-500" />{" "}
            Preferences
          </h2>
          <p className="text-sm text-gray-500">
            Notification, theme, and language settings will go here.
          </p>
        </section>

        {/* --- Billing Section (Placeholder) --- */}
        <section
          id="billing-settings"
          className="bg-white shadow-xl rounded-lg p-6 sm:p-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-4">
            Subscription & Billing
          </h2>
          <p className="text-sm text-gray-500">
            Subscription management and billing history will go here.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
