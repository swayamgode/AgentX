import { ConvexHttpClient } from "convex/browser";
const client = new ConvexHttpClient("https://fine-finch-335.convex.cloud");

// Patch fetch to include Origin
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  options.headers = options.headers || {};
  options.headers["Origin"] = "http://localhost:3000";
  return originalFetch(url, options);
};

async function main() {
  try {
    await client.action("auth:signIn", { 
      provider: "password",
      params: { flow: "signUp", email: "swayamgode554@gmail.com", password: "password123", name: "Swayam" }
    });
    console.log("Success with Origin!");
  } catch (err) {
    console.error("Error with Origin:", err.message);
  }
}
main();
