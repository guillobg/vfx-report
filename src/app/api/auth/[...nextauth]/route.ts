import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const AIRTABLE_TOKEN = process.env.AIRTABLE_API_TOKEN!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const USERS_TABLE = "tblSqxvPfd0dHgCFm";

async function findUserByEmail(email: string) {
  const formula = encodeURIComponent(`AND({Email} = '${email}', {Active} = TRUE())`);
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${USERS_TABLE}?filterByFormula=${formula}&maxRecords=1`,
    {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    }
  );
  const data = await res.json();
  if (!data.records?.length) return null;

  const record = data.records[0];
  return {
    id: record.id,
    email: record.fields["Email"] as string,
    password: record.fields["Password"] as string,
    name: record.fields["Name"] as string,
    role: (record.fields["Role"] as string) || "coordinator",
    projects: (record.fields["Project CODEs"] as string[]) || [],
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await findUserByEmail(credentials.email);
        if (!user) return null;

        // Simple password check (in production, use hashed passwords)
        if (user.password !== credentials.password) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          projects: user.projects,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.projects = (user as any).projects;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).projects = token.projects;
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
