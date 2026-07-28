const prompt = "FILE: test.js\nTOOLS AVAILABLE: none\nCODE:\nconst x = 1;\nconsole.log(x);";
const systemPrompt = 'Optimize the code. JSON ONLY: { "improved": bool, "new_code": "string", "insight": "string" }';
fetch("http://localhost:3000/api/think", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt, customSystemInstruction: systemPrompt })
}).then(r => r.json()).then(console.log).catch(console.error);
