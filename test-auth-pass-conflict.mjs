import { ConvexHttpClient } from "convex/browser";
const client = new ConvexHttpClient("https://cool-vole-818.convex.cloud");

async function main() {
  try {
    await client.action("auth:signIn", { 
      provider: "password",
      params: { flow: "signUp", email: "newuser999@gmail.com", password: "passwordAAA", name: "Swayam" }
    });
    console.log("Success 1 (SignUp)");

    await client.action("auth:signIn", { 
      provider: "password",
      params: { flow: "signUp", email: "newuser999@gmail.com", password: "passwordBBB", name: "Swayam" }
    });
    console.log("Success 2 (SignUp with diff pass)");
  } catch (err) {
    console.error("Error occurred:", err.message);
  }
}
main();
