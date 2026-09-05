import { Role } from "../../../generated/prisma/enums";

export interface ILoginUserPayload {
  email: string;
  password: string;
}

export interface IRegisterCitizenPayload {
  name: string;
  email: string;
  password: string;
  citizen: {
    contactNumber?: string;
   };
}

export interface IRequestUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export interface IGoogleLoginPayload {
  idToken: string;
}
