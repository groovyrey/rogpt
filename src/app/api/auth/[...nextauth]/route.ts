import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "roblox",
      name: "Roblox",
      type: "oauth",
      wellKnown: "https://apis.roblox.com/oauth/.well-known/openid-configuration",
      authorization: { params: { scope: "openid profile user.advanced:read user.social:read" } },
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
          verified: profile.verified,
          ageBracket: profile.age_bracket,
          premium: profile.premium,
          social: profile.social_accounts,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        token.verified = profile.verified;
        token.ageBracket = profile.age_bracket;
        token.premium = profile.premium;
        token.social = profile.social_accounts;
        token.displayName = profile.nickname;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.verified = token.verified;
        session.user.ageBracket = token.ageBracket;
        session.user.premium = token.premium;
        session.user.social = token.social;
        session.user.displayName = token.displayName;
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
