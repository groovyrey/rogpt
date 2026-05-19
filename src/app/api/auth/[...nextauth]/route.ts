import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "roblox",
      name: "Roblox",
      type: "oauth",
      wellKnown: "https://apis.roblox.com/oauth/.well-known/openid-configuration",
      authorization: { params: { scope: "openid profile email asset:read group:read" } },
      idToken: true,
      checks: ["pkce", "state"],
      clientId: process.env.ROBLOX_CLIENT_ID,
      clientSecret: process.env.ROBLOX_CLIENT_SECRET,
      client: {
        id_token_signed_response_alg: "ES256",
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.preferred_username,
          displayName: profile.nickname,
          image: profile.picture,
        };
      },
    },
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error - NextAuth Session user type doesn't include 'id' by default
        session.user.id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
