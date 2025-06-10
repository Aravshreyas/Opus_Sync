const mongoose = require("mongoose");
const UserModel = require("../models/user.model");
const AccountModel = require("../models/account.model");
const WorkspaceModel = require("../models/workspace.model");
const RoleModel = require("../models/roles-permission.model");
const MemberModel = require("../models/member.model");
const { Roles } = require("../enums/role.enum");
const { ProviderEnum } = require("../enums/account-provider.enum");
const {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} = require("../utils/appError");
const jwt = require('jsonwebtoken')

// --- NEW IMPORTS FOR OTP ---
const OtpModel = require("../models/otp.model");
const otpGenerator = require('otp-generator');
const { hashValue, compareValue } = require("../utils/bcrypt");
const { sendEmail } = require("./email.service");
// -------------------------

const loginOrCreateAccountService = async (data) => {
  const { providerId, provider, displayName, email, picture } = data;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    let user = await UserModel.findOne({ email }).session(session);

    if (!user) {
      user = new UserModel({
        email,
        name: displayName,
        profilePicture: picture || null,
        defaultProfilePictureUrl: picture || null,
        isVerified: true, // Users from social providers are considered verified by default
      });
      await user.save({ session });

      const account = new AccountModel({
        userId: user._id,
        provider: provider,
        providerId: providerId,
      });
      await account.save({ session });

      const workspace = new WorkspaceModel({
        name: `${user.name}'s Workspace`,
        owner: user._id,
      });
      await workspace.save({ session });

      const ownerRole = await RoleModel.findOne({ name: Roles.OWNER }).session(session);
      if (!ownerRole) {
        throw new NotFoundException("Owner role not found. System configuration issue.");
      }

      const member = new MemberModel({
        userId: user._id,
        workspaceId: workspace._id,
        role: ownerRole._id,
      });
      await member.save({ session });

      user.currentWorkspace = workspace._id;
      await user.save({ session });
    } else {
      if (!user.defaultProfilePictureUrl && picture) {
        user.defaultProfilePictureUrl = picture;
        if (!user.profilePicture) {
          user.profilePicture = picture;
        }
        await user.save({ session });
      }
    }

    await session.commitTransaction();
    const finalUser = await UserModel.findById(user._id).select("-password").populate("currentWorkspace").session(session);
    return { user: finalUser };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const registerUserService = async (body) => {
  const { email, name, password } = body;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const existingUser = await UserModel.findOne({ email }).session(session);
    if (existingUser) {
      // If user exists but is not verified, allow the process to continue to resend OTP
      if (!existingUser.isVerified) {
          console.log(`Existing unverified user found for ${email}. Proceeding to send OTP.`);
          return { userId: existingUser._id, email: existingUser.email };
      }
      throw  BadRequestException("Email already exists and is verified.");
    }

    const user = new UserModel({
      email,
      name,
      password,
      isVerified: false, // User starts as unverified
    });
    await user.save({ session });

    const account = new AccountModel({
      userId: user._id,
      provider: ProviderEnum.EMAIL,
      providerId: email,
    });
    await account.save({ session });

    const workspace = new WorkspaceModel({
      name: `${user.name}'s Workspace`,
      owner: user._id,
    });
    await workspace.save({ session });

    const ownerRole = await RoleModel.findOne({ name: Roles.OWNER }).session(session);
    if (!ownerRole) throw new NotFoundException("Owner role not found");

    const member = new MemberModel({
      userId: user._id,
      workspaceId: workspace._id,
      role: ownerRole._id,
    });
    await member.save({ session });

    user.currentWorkspace = workspace._id;
    await user.save({ session });

    await session.commitTransaction();
    return { userId: user._id, email: user.email };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const verifyUserService = async ({ email, password, provider = ProviderEnum.EMAIL }) => {
  const account = await AccountModel.findOne({ provider, providerId: email });
  if (!account) {
    throw  UnauthorizedException("Invalid email or password");
  }

  const user = await UserModel.findById(account.userId).select("+password"); // Select password for comparison
  if (!user) {
    throw  NotFoundException("User not found for the given account");
  }

  if (!user.isVerified) {
    throw  UnauthorizedException("Account not verified. Please check your email for an OTP.");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw  UnauthorizedException("Invalid email or password");
  }

  // Re-fetch without password for the return payload
  const finalUser = await UserModel.findById(account.userId)
  return finalUser;
};

// --- NEW SERVICES FOR OTP FLOW ---

const sendOtpForVerificationService = async ({ email }) => {
    const user = await UserModel.findOne({ email });
    if (!user) throw  BadRequestException("No account found with this email.");
    if (user.isVerified) throw  BadRequestException("This account is already verified.");
    
    await OtpModel.deleteMany({ email });

    const otp = otpGenerator.generate(6, { 
        upperCaseAlphabets: false, 
        lowerCaseAlphabets: false, 
        specialChars: false 
    });

    console.log(`Generated OTP for ${email}: ${otp}`); // For debugging

    const hashedOtp = await hashValue(otp);
    await OtpModel.create({ email, otp: hashedOtp });

    try {
        await sendEmail({
            email: email,
            subject: 'Your Opus Sync Verification Code',
            message: `Your one-time verification code is: ${otp}\n\nIt is valid for 5 minutes.`
        });
    } catch (emailError) {
        console.error("Email sending error:", emailError);
        throw new Error("Could not send OTP email. Please try again later.");
    }
    
    return { message: "OTP sent successfully. Please check your email." };
};

const verifyOtpService = async ({ email, otp }) => {
    if (!email || !otp) throw  BadRequestException("Email and OTP are required.");

    const otpRecord = await OtpModel.findOne({ email });
    if (!otpRecord) throw  BadRequestException("OTP is invalid or has expired. Please request a new one.");

    const isMatch = await compareValue(otp, otpRecord.otp);
    if (!isMatch) throw  UnauthorizedException("Invalid OTP. Please try again.");

    const user = await UserModel.findOneAndUpdate(
        { email }, 
        { isVerified: true }, 
        { new: true }
    )

    await OtpModel.deleteOne({ email });

    if (!user) throw  NotFoundException("User not found after verification.");
    
    return { user };
};

const requestPasswordResetService = async ({ email }) => {
    const user = await UserModel.findOne({ email });
    if (!user) {
        console.log(`Password reset requested for non-existent email: ${email}`);
        return; 
    }
    await OtpModel.deleteMany({ userId: user._id }); // Use userId if your OTP model has it, else email
    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
    console.log(`Generated OTP for ${email}: ${otp}`);
    const hashedOtp = await hashValue(otp);
    await OtpModel.create({ email, otp: hashedOtp });
    const resetUrl = `${process.env.FRONTEND_ORIGIN}/verify-password-otp`; // The link can just point to the OTP page
    const message = `You requested a password reset. Your verification code is: ${otp}\n\nThis code is valid for 5 minutes.\n\nPlease enter this code on the verification page: ${resetUrl}`;
    try {
        await sendEmail({ email: user.email, subject: 'Password Reset Code', message });
    } catch (emailError) {
        console.error("Password reset email sending error:", emailError);
        throw new Error("Could not send password reset email.");
    }
    return { message: "If an account with this email exists, an OTP has been sent." };
};

// NEW service to verify the OTP and issue a temporary token
const verifyPasswordResetOtpService = async ({ email, otp }) => {
    if (!email || !otp) throw new BadRequestException("Email and OTP are required.");

    const otpRecord = await OtpModel.findOne({ email });
    if (!otpRecord) throw new BadRequestException("OTP is invalid or has expired. Please request a new one.");

    const isOtpMatch = await compareValue(otp, otpRecord.otp);
    if (!isOtpMatch) throw new UnauthorizedException("Invalid OTP. Please try again.");

    const user = await UserModel.findOne({ email });
    if (!user) throw new NotFoundException("User associated with OTP not found.");

    // OTP is valid, now create a temporary, single-purpose token for password reset
    const passwordResetToken = jwt.sign(
        { userId: user._id, purpose: 'PASSWORD_RESET' },
        process.env.JWT_SECRET,
        { expiresIn: '10m' } // This token is valid for only 10 minutes
    );

    await OtpModel.deleteOne({ email }); // Delete the OTP so it can't be used again

    return { passwordResetToken };
};


// MODIFIED service to reset the password using the temporary token
const resetPasswordService = async ({ resetToken, newPassword }) => {
    if (!resetToken || !newPassword) {
        throw new BadRequestException("A reset token and a new password are required.");
    }

    let decoded;
    try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
        throw new UnauthorizedException("Invalid or expired password reset token.");
    }

    // Ensure the token's purpose is correct
    if (decoded.purpose !== 'PASSWORD_RESET') {
        throw new UnauthorizedException("Invalid token purpose.");
    }
    
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
        throw new NotFoundException("User not found.");
    }

    user.password = newPassword; // The pre-save hook in your User model will hash this
    await user.save();

    return { message: "Password has been reset successfully. You can now log in." };
};

module.exports = {
  loginOrCreateAccountService,
  registerUserService,
  verifyUserService,
  sendOtpForVerificationService, 
  verifyOtpService,               
   requestPasswordResetService,
  verifyPasswordResetOtpService,
  resetPasswordService,
};