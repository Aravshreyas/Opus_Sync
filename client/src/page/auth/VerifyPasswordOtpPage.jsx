import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, AudioLines } from 'lucide-react';

const VerifyPasswordOtpPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(60);

    useEffect(() => {
        if (!email) {
            navigate('/forgot-password');
        }
    }, [email, navigate]);

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
            setError("Please enter a valid 6-digit OTP.");
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            // Call the endpoint to verify the OTP for password reset
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/auth/verify-password-otp`,
                { email, otp }
            );
            
            const { passwordResetToken } = response.data;
            if (passwordResetToken) {
                // On success, navigate to the final password reset page,
                // passing the temporary token needed for authorization.
                navigate('/reset-password', { state: { resetToken: passwordResetToken } });
            } else {
                throw new Error("Could not get password reset token.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid or expired OTP.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            // This is the same endpoint used to initially request the OTP
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/forgot-password`, { email });
            setSuccessMessage("A new OTP has been sent to your email.");
            setResendCooldown(60);
        } catch (err) {
            setError("Failed to resend OTP. Please try again later.");
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
                    <h2 className="text-2xl font-bold text-center text-gray-800">Enter Verification Code</h2>
                    <p className="text-center text-gray-600 mt-2 mb-6">Enter the 6-digit code sent to <span className="font-medium">{email}</span> to proceed.</p>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="otp" className="sr-only">OTP</label>
                            <input
                                id="otp" type="text" value={otp} onChange={(e) => { if (/^\d*$/.test(e.target.value)) setOtp(e.target.value); }}
                                maxLength="6"
                                className="w-full text-center text-3xl tracking-[0.5em] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                placeholder="------" disabled={isLoading} required
                            />
                        </div>
                        {error && <p className="text-sm text-red-600 text-center mb-4">{error}</p>}
                        {successMessage && <p className="text-sm text-green-600 text-center mb-4">{successMessage}</p>}
                        <button type="submit" disabled={isLoading} className="w-full bg-black text-white py-3 rounded-md font-semibold hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center">
                            {isLoading && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
                            {isLoading ? "Verifying..." : "Verify Code"}
                        </button>
                    </form>
                    <div className="mt-6 text-center text-sm">
                        <p className="text-gray-600">Didn't receive the code?</p>
                        <button onClick={handleResendOtp} disabled={resendCooldown > 0 || isLoading} className="font-medium text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed">
                            Resend Code {resendCooldown > 0 ? `(${resendCooldown}s)` : ''}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyPasswordOtpPage;