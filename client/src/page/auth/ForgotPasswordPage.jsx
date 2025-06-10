import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, AudioLines } from 'lucide-react';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setError("Email address is required.");
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            // This endpoint will silently succeed even if email doesn't exist
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/auth/forgot-password`,
                { email }
            );
            setSuccessMessage(response.data.message);
            // Give user time to read the success message, then navigate to OTP entry
            setTimeout(() => {
                navigate('/verify-password-otp', { state: { email } });
            }, 2500);

        } catch (err) {
            // This will likely only catch server errors (e.g., email service down)
            const msg = err.response?.data?.message || "An error occurred. Please try again.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md">
                <Link to="/" className="flex items-center gap-2 self-center justify-center font-medium text-gray-800 mb-6">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-white">
                        <AudioLines className="size-4" />
                    </div>
                    Opus Sync
                </Link>
                <div className="bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-center text-gray-800">Reset Your Password</h2>
                    <p className="text-center text-gray-600 mt-2 mb-6">Enter your email address and we'll send you a verification code to reset your password.</p>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full text-lg p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-red-600 text-center mb-4">{error}</p>}
                        {successMessage && <p className="text-sm text-green-600 text-center mb-4">{successMessage}</p>}
                        <button type="submit" disabled={isLoading} className="w-full bg-black text-white py-3 rounded-md font-semibold hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center">
                            {isLoading && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
                            {isLoading ? "Sending Code..." : "Send Reset Code"}
                        </button>
                    </form>
                    <div className="mt-6 text-center text-sm">
                        <Link to="/" className="font-medium text-indigo-600 hover:text-indigo-500">Back to Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;