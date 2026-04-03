import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
        profile(params) {
            return {
                email: params.email as string,
                name: params.name as string,
            };
        },
        validatePasswordRequirements: (password) => {
            if (password.length < 6) {
                throw new ConvexError("Password must be at least 6 characters.");
            }
        }
    })
  ],
});
