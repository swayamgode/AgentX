import { ConvexHttpClient } from "convex/browser";
const client = new ConvexHttpClient("https://cool-vole-818.convex.cloud");

async function main() {
  try {
    await client.action("auth:signIn", { 
      provider: "password",
      params: { flow: "signUp", email: "test3@example.com", id: "test3@example.com", password: "password123", name: "Test User 3" }
    });
    console.log("Success");
  } catch (err) {
    console.error("Error occurred with id parameter:");
    console.error(err.message);
  }
}
main();
