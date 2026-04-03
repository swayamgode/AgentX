const https = require("https");

const postData = JSON.stringify({
  actionName: "auth:signIn",
  args: { 
    params: { flow: "signUp", email: "test@example.com", password: "password123", name: "Test User" },
    provider: "password"
  },
  format: "json"
});

const req = https.request({
  hostname: "cool-vole-818.convex.cloud",
  path: "/api/action",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  }
}, (res) => {
  let body = "";
  res.on("data", (chunk) => body += chunk);
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    console.log("Response:", body);
  });
});

req.on("error", (e) => console.error(e));
req.write(postData);
req.end();
