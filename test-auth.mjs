import { ConvexHttpClient } from "convex/browser";
const client = new ConvexHttpClient("https://cool-vole-818.convex.cloud");

async function main() {
  try {
    await client.action("auth:signIn", { 
      provider: "password",
      params: { flow: "signUp", email: "test2@example.com", password: "password123", name: "Test User" }
    });
    console.log("Success");
  } catch (err) {
    console.error("Error occurred:");
    console.error(err);
  }
}
main();
