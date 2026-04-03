import { ConvexHttpClient } from "convex/browser";
const client = new ConvexHttpClient("https://fine-finch-335.convex.cloud");

async function main() {
  try {
    await client.action("auth:signIn", { 
      provider: "password",
      params: { flow: "signUp", email: "test-undefined-name@example.com", password: "password123" }
    });
    console.log("Success with undefined name!");
  } catch (err) {
    console.error("Error with undefined name:", err.message);
  }
}
main();
