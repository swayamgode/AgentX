import { ConvexHttpClient } from "convex/browser";
const client = new ConvexHttpClient("https://fine-finch-335.convex.cloud");

async function main() {
  try {
    await client.action("auth:signIn", { 
      provider: "password",
      params: { flow: "signUp", email: "test-empty-name@example.com", password: "password123", name: "" }
    });
    console.log("Success with empty name!");
  } catch (err) {
    console.error("Error with empty name:", err.message);
  }
}
main();
