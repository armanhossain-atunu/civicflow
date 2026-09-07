/** biome-ignore-all lint/style/useImportType: <explanation> */
/** biome-ignore-all assist/source/organizeImports: <explanation> */
import {
  IForgetPasswordPayload,
  IGoogleLoginPayload,
  ILoginUserPayload,
  IRegisterCitizenPayload,
  IRequestUser,
  IResetPasswordPayload,
} from "./auth.interface";
import bcrypt from "bcrypt";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwt";
import { JwtPayload, SignOptions } from "jsonwebtoken";
import {
  AuthProvider,
  Role,
  UserStatus,
} from "../../../generated/prisma/enums";
import { TokenPayload } from "google-auth-library";
import { googleClient } from "../../lib/googleAuth";
import crypto from "crypto";
import { redisClient } from "../../lib/redis";
import { transporter } from "../../lib/Nodemailer";

const registerUser = async (payload: IRegisterCitizenPayload) => {
  const { name, password, citizen: citizenData } = payload;
  const email = payload.email.trim().toLowerCase();

  const isUserExists = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExists) {
    throw new Error("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 8);

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: Role.CITIZEN,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      citizen: {
        create: {
          name,
          email,
          contactNumber: citizenData?.contactNumber || "",
        },
      },
    },
    omit: { password: true },
    include: { citizen: true },
  });

  const { citizen, ...user } = createdUser;
  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    user,
    citizen,
    accessToken,
    refreshToken,
  };
};

const loginUser = async (payload: ILoginUserPayload) => {
  const { password } = payload;
  const email = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new Error("User is blocked");
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new Error("User is deleted");
  }
  if (user.password === null && user.googleId !== null) {
    throw new Error("User registered with Google. Please login with Google.");
  }
  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password as string,
  );

  if (!isPasswordMatched) {
    throw new Error("Invalid credentials");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const getMe = async (user: IRequestUser) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      id: user.userId,
    },
    include: {
      citizen: true,
    },
    omit: {
      password: true,
    },
  });

  if (!isUserExists) {
    throw new Error("User not found");
  }

  return isUserExists;
};
//
const refreshToken = async (token: string) => {
  const verifiedRefreshToken = jwtUtils.verifyToken(
    token,
    config.jwt_refresh_secret,
  );

  if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
    throw new Error(
      config.node_env === "development"
        ? verifiedRefreshToken.error
        : "Invalid refresh token",
    );
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
    throw new Error("User is inactive or not found");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

// google loging
const googleLogin = async (payload: IGoogleLoginPayload) => {
  let googleIdTokenPayload: TokenPayload | null | undefined = null;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: payload.idToken,
      audience: config.google_client_id,
    });

    googleIdTokenPayload = ticket.getPayload();
  } catch (error) {
    console.log("Google ID Token Verification Failed", error);
    throw new Error("Invalid Or Expired Google Id Token");
  }

  if (!googleIdTokenPayload) {
    throw new Error("Invalid Or Expired Google Id Token");
  }

  if (!googleIdTokenPayload.email) {
    throw new Error("Google Email Not Found");
  }
  if (!googleIdTokenPayload.name) {
    throw new Error("Google Email User Name Not Found");
  }

  const ifCitizenExistWithGoogleAuth = await prisma.user.findUnique({
    where: {
      email: googleIdTokenPayload.email,
      role: Role.CITIZEN,
      googleId: googleIdTokenPayload.sub,
    },
  });

  let user = ifCitizenExistWithGoogleAuth;

  if (!ifCitizenExistWithGoogleAuth) {
    const ifCitizenExistWithCredentials = await prisma.user.findUnique({
      where: {
        email: googleIdTokenPayload.email,
        role: Role.CITIZEN,
        authProvider: AuthProvider.CREDENTIAL,
      },
    });

    if (ifCitizenExistWithCredentials) {
      if (!ifCitizenExistWithCredentials.emailVerified) {
        throw new Error("Email Not Verified");
      }

      if (ifCitizenExistWithCredentials.status === UserStatus.BLOCKED) {
        throw new Error("User Is Blocked");
      }

      if (
        ifCitizenExistWithCredentials.isDeleted ||
        ifCitizenExistWithCredentials.status === UserStatus.DELETED
      ) {
        throw new Error("User Is Deleted");
      }

      user = await prisma.user.update({
        where: {
          id: ifCitizenExistWithCredentials.id,
        },

        data: {
          googleId: googleIdTokenPayload.sub,
        },
      });
    } else {
      // Google Register
      user = await prisma.user.create({
        data: {
          name: googleIdTokenPayload.name,
          email: googleIdTokenPayload.email,
          role: Role.CITIZEN,
          googleId: googleIdTokenPayload.sub,
          authProvider: AuthProvider.GOOGLE,
          emailVerified: true,
          citizen: {
            create: {
              name: googleIdTokenPayload.name,
              email: googleIdTokenPayload.email,
            },
          },
        },
      });
    }
  }

  if (!user) {
    throw new Error("User Not Found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new Error("User Is Blocked");
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new Error("User Is Deleted");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const forgetPassword = async (payload: IForgetPasswordPayload) => {
  const { email } = payload;
  const isUserExists = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!isUserExists) {
    throw new Error("User Not Found");
  }
  if (!isUserExists.emailVerified) {
    throw new Error("Email Not Verified");
  }
  if (isUserExists.status === UserStatus.BLOCKED) {
    throw new Error("User Is Blocked");
  }
  if (isUserExists.isDeleted || isUserExists.status === UserStatus.DELETED) {
    throw new Error("User Is Deleted");
  }
  if (
    isUserExists.googleId &&
    isUserExists.authProvider === AuthProvider.GOOGLE
  ) {
    throw new Error("User registered with Google. Please login with Google.");
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const key = `ForgetPassword-OTP:${isUserExists.email}`;

  await redisClient.set(key, otp, {
    expiration: {
      type: "EX",
      value: 5 * 60,
    },
  });
  await transporter.sendMail({
    from: config.email_sender,
    to: isUserExists.email,
    subject: "Forget Password OTP",
    text: `Your OTP is ${otp}`,
  });
};
const resetPassword = async (payload: IResetPasswordPayload) => {
  const { email, otp, newPassword } = payload;
  const isUserExists = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!isUserExists) {
    throw new Error("User Not Found");
  }
  if (!isUserExists.emailVerified) {
    throw new Error("Email Not Verified");
  }
  if (isUserExists.status === UserStatus.BLOCKED) {
    throw new Error("User Is Blocked");
  }
  if (isUserExists.isDeleted || isUserExists.status === UserStatus.DELETED) {
    throw new Error("User Is Deleted");
  }
  if (
    isUserExists.googleId &&
    isUserExists.authProvider === AuthProvider.GOOGLE
  ) {
    throw new Error("User registered with Google. Please login with Google.");
  }
  const key = `ForgetPassword-OTP:${isUserExists.email}`;
  const redisOtp = await redisClient.get(key);

  if (!redisOtp) {
    throw new Error("OTP Expired");
  }
  if (redisOtp !== otp) {
    throw new Error("Invalid OTP");
  }
  const hashedNewPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );
  await prisma.user.update({
    where: {
      email,
    },
    data: {
      password: hashedNewPassword,
    },
  });

  await redisClient.del([key]);
 await transporter.sendMail({
    from: config.email_sender,
    to: isUserExists.email,
    subject: "Password Reset Success",
    text: "Your Password Reset Successfully Completed",
  });

};
export const AuthService = {
  registerUser,
  loginUser,
  getMe,
  refreshToken,
  googleLogin,
  forgetPassword,
  resetPassword,
};
