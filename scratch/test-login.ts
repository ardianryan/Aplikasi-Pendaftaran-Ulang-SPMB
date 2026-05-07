
async function testLogin() {
  const res = await fetch("http://localhost:3000/api/auth/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" })
  });
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", data);
}

testLogin().catch(console.error);
