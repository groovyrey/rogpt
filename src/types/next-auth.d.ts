import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      displayName?: string;
      verified?: boolean;
      ageBracket?: string;
      premium?: boolean;
      social?: any;
    } & DefaultSession["user"];
    accessToken?: string;
  }

  interface User extends DefaultUser {
    displayName?: string;
    verified?: boolean;
    ageBracket?: string;
    premium?: boolean;
    social?: any;
  }

  interface Profile {
    sub: string;
    preferred_username: string;
    nickname: string;
    picture: string;
    verified: boolean;
    age_bracket: string;
    premium: boolean;
    social_accounts: any;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    displayName?: string;
    verified?: boolean;
    ageBracket?: string;
    premium?: boolean;
    social?: any;
  }
}
