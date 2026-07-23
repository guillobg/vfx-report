import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "coordinator" | "admin";
      projects: string[];
    };
  }

  interface User {
    role: string;
    projects: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    projects: string[];
  }
}
