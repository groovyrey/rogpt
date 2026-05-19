import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "roblox",
      name: "Roblox",
      type: "oauth",
      wellKnown: "https://apis.roblox.com/oauth/.well-known/openid-configuration",
      authorization: { params: { scope: "openid profile verification age premium roles attributes credentials asset:read asset:write group:read group:view group:write universe:write universe-place:write universe.place:write universe-places:write universe-datastore:read universe-datastore:write universe-datastores.objects:read universe-datastores.objects:write universe-datastores.objects:list universe-datastores.control:list universe-ordered-datastore:read universe-ordered-datastore:write universe-messaging-service:publish legacy-universe.following:read legacy-universe.following:write creator-store-product:read creator-store-product:write" } },
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
        // @ts-expect-error - Custom profile fields
        token.verified = profile.verified;
        // @ts-expect-error - Custom profile fields
        token.ageBracket = profile.age_bracket;
        // @ts-expect-error - Custom profile fields
        token.premium = profile.premium;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error - Custom fields
        session.user.id = token.sub;
        // @ts-expect-error - Custom fields
        session.user.verified = token.verified;
        // @ts-expect-error - Custom fields
        session.user.ageBracket = token.ageBracket;
        // @ts-expect-error - Custom fields
        session.user.premium = token.premium;
        // @ts-expect-error - Custom fields
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
