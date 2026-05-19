import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "roblox",
      name: "Roblox",
      type: "oauth",
      wellKnown: "https://apis.roblox.com/oauth/.well-known/openid-configuration",
      authorization: { params: { scope: "openid profile asset:read asset:write avatar-auto-setup-job:read avatar-auto-setup-job:write commerce-item:read commerce-item:write creator-store-product:read creator-store-product:write developer-product:read developer-product:write game-pass:read game-pass:write group-forum:read group-forum:write group:read group:write legacy-asset:manage legacy-badge:manage legacy-developer-product:manage legacy-game-pass:manage legacy-group:manage legacy-team-collaboration:manage legacy-universe:manage legacy-universe.badge:manage-and-spend-robux legacy-universe.badge:write legacy-universe.following:read legacy-universe.following:write legacy-user:manage thumbnail:read universe-messaging-service:publish universe:read universe:write universe.place:write universe.place.luau-execution-session:read universe.place.luau-execution-session:write universe.subscription-product.subscription:read universe.user-restriction:read universe.user-restriction:write user.advanced:read user.commerce-merchant-connection:read user.commerce-merchant-connection:write user.inventory-item:read user.social:read user.user-notification:write" } },
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
