
const baseUrl = "https://mirros.vercel.app";
const fs = require("fs");
const path = require("path");
const sessionFile = path.join(__dirname, "bot_session.json");

let session = { cookies: "", userId: "", roomId: "" };

if (fs.existsSync(sessionFile)) {
  session = JSON.parse(fs.readFileSync(sessionFile, "utf8"));
}

function saveSession() {
  fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
}

async function api(path, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Cookie": session.cookies
    }
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${baseUrl}${path}`, options);
  
  // Only try to parse JSON if there's content
  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch(e) { console.error("Parse error:", text); }
  }
  
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const match = setCookie.match(/mirros_session=([^;]+)/);
    if (match) {
      session.cookies = `mirros_session=${match[1]}`;
      saveSession();
    }
  }
  
  return { status: res.status, data };
}

async function run() {
  const args = process.argv.slice(2);
  const action = args[0];
  const value = args[1];

  if (action === "login") {
    console.log("Logging in...");
    const { data } = await api("/api/auth/login", "POST", {
      username: "TestGuest",
      provider: "GUEST",
      deviceId: "bot_dedikodu_tester_v1"
    });
    session.userId = data.userId;
    saveSession();
    console.log("Logged in as:", data.username, "ID:", session.userId);
  } else if (action === "join") {
    console.log("Joining room:", value);
    const { data } = await api("/api/rooms/join", "POST", {
      code: value,
      ageGroup: "ADULT"
    });
    if (data && data.error) {
      console.error("Join failed:", data.error);
    } else if (data) {
      session.roomId = data.id;
      saveSession();
      console.log("Joined successfully! Room ID:", session.roomId);
    }
  } else if (action === "status") {
    console.log("Checking status for room ID:", session.roomId);
    const { data } = await api(`/api/rooms/${session.roomId}`);
    console.log("Room status:", data.status);
    if (data.activeGameId) {
      console.log("Active Game ID:", data.activeGameId);
      // Fetch game details to find active round
      const { data: gameData } = await api(`/api/games/${data.activeGameId}`);
      if (gameData && gameData.rounds) {
        const activeRound = gameData.rounds.find(r => r.status !== "SCORED");
        if (activeRound) {
          console.log("Active Round ID:", activeRound.id, "Number:", activeRound.number);
          // Save for future use
          session.activeRoundId = activeRound.id;
          saveSession();
        } else {
          console.log("No active round found.");
        }
      }
    } else {
      console.log("Game not started yet.");
    }
  } else if (action === "guess") {
    const roundId = value;
    const content = args[2] || "TestGuest"; 
    console.log(`Submitting guess for round ${roundId}: ${content}`);
    const { data } = await api(`/api/rounds/${roundId}/guess`, "POST", {
      content,
      reason: "Bot vote"
    });
    console.log("Guess result:", data);
  }
}

run().catch(console.error);
