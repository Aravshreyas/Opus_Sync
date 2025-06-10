import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, AudioLines } from 'lucide-react';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const resetToken = location.state?.resetToken;

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (!resetToken) {
            console.error("No password reset token found. Redirecting.");
            navigate('/forgot-password', { replace: true });
        }
    }, [resetToken, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
        if (newPassword.length < 6) { setError("Password must be at least 6 characters long."); return; }
        
        setIsLoading(true); setError(''); setSuccessMessage('');

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/auth/reset-password`,
                { resetToken, newPassword }
            );
            setSuccessMessage(response.data.message + " Redirecting to login...");
            setTimeout(() => { navigate('/'); }, 2500);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to reset password. The token may be invalid or expired.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md">
                <Link to="/" className="flex items-center gap-2 self-center justify-center font-medium text-gray-800 mb-6">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-white"><AudioLines className="size-4" /></div>
                    Opus Sync
                </Link>
                <div className="bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-center text-gray-800">Set Your New Password</h2>
                    <p className="text-center text-gray-600 mt-2 mb-6">Your token has been verified. Please enter a new password.</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="newPassword">New Password</label>
                            <input
                                id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <input
                                id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                        {successMessage && <p className="text-sm text-green-600 text-center">{successMessage}</p>}

                        <button type="submit" disabled={isLoading} className="w-full bg-black text-white py-3 rounded-md font-semibold hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center">
                            {isLoading && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;