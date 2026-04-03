import { ConvexHttpClient } from "convex/browser";
const client = new ConvexHttpClient("https://fine-finch-335.convex.cloud");

async function main() {
  try {
    await client.action("auth:signIn", { 
      provider: "password",
      params: { flow: "signUp", email: "swayamgode554@gmail.com", password: "password123", name: "Swayam" }
    });
    console.log("Success Prod Swayam!");
  } catch (err) {
    console.error("Error Prod Swayam:", err.message);
  }
}
main();
