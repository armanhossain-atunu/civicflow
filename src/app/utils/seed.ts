import bcrypt from "bcrypt";
import { Role } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";

export const seedAdmin = async () => {
  try {
    const isAdminExist = await prisma.user.findFirst({
      where: {
        role: Role.ADMIN,
      },
    });

    if (isAdminExist) {
      console.log("Admin Already Exists!");
      return;
    }

    const name = config.admin_name;
    const email = config.admin_email;
    const password = config.admin_password;

    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );

    const Admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.ADMIN,
        needPasswordChange: false,
        emailVerified: true,
      },
    });

    console.log("Admin Created : ", Admin);
  } catch (error) {
    console.log("Error Seeding Admin : ", error);

    // await prisma.user.delete({
    //   where: {
    //     email: config.admin_email,
    //   },
    // });
  }
};

//create manager

export const seedManager = async () => {
  try {
    const isManagerExist = await prisma.user.findUnique({
      where: {
        email: config.manager_email,
      },
    });

    if (isManagerExist) {
      console.log("Manager Already Exists!");
      return;
    }

    const name = config.manager_name;
    const email = config.manager_email;
    const password = config.manager_password;

    if (!name || !email || !password) {
      throw new Error(
        "Manager Name , Email, Password Missing In Env File!!!",
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );

    const manager = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.MANAGER,
        needPasswordChange: false,
        emailVerified: true,
      },
    });

    console.log("Manager Created : ", manager);
  } catch (error) {
    console.log("Error Seeding Manager : ", error);

    // await prisma.user.delete({
    //   where: {
    //     email: config.manager_email,
    //   },
    // });
  }
};

// create tester technician

export const seedTechnician = async () => {
  try {
    const isTechnicianExist = await prisma.user.findUnique({
      where: {
        email: config.technician_email,
      },
    });

    if (isTechnicianExist) {
      console.log("Tester Technician Already Exists!");
      return;
    }

    const name = config.technician_name;
    const email = config.technician_email;
    const password = config.technician_password;

    if (!name || !email || !password) {
      throw new Error(
        "Tester Technician Name , Email, Password Missing In Env File!!!",
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );

    const Technician = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.TECHNICIAN,
        needPasswordChange: false,
        emailVerified: true,
      },
    });

    console.log("Tester Technician Created : ", Technician);
  } catch (error) {
    console.log("Error Seeding Tester Technician : ", error);

    // await prisma.user.delete({
    //   where: {
    //     email: config.technician_email,
    //   },
    // });
  }
};
