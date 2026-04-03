import { ConvexHttpClient } from "convex/browser";
const client = new ConvexHttpClient("https://fine-finch-335.convex.cloud");

async function main() {
  try {
    await client.action("auth:signIn", { 
      provider: "password",
      params: { flow: "signUp", email: "testprod@example.com", id: "testprod@example.com", password: "password123", name: "Test User Prod" }
    });
    console.log("Success on Prod!");
  } catch (err) {
    console.error("Error occurred on Prod:");
    console.error(err.message);
  }
}
main();
