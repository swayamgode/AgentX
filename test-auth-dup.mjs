import { ConvexHttpClient } from "convex/browser";
const client = new ConvexHttpClient("https://cool-vole-818.convex.cloud");

async function main() {
  try {
    await client.action("auth:signIn", { 
      provider: "password",
      params: { flow: "signUp", email: "swayamgode554@gmail.com", id: "swayamgode554@gmail.com", password: "password123", name: "Swayam" }
    });
    console.log("Success 1");
  } catch (err) {
    console.error("Error 1:", err.message);
  }

  try {
    await client.action("auth:signIn", { 
      provider: "password",
      params: { flow: "signUp", email: "swayamgode554@gmail.com", id: "swayamgode554@gmail.com", password: "password123", name: "Swayam" }
    });
    console.log("Success 2");
  } catch (err) {
    console.error("Error 2:", err.message);
  }
}
main();
