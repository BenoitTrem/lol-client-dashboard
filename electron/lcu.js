const fs = require("fs");
const https = require("https");

function getLockfile() {
  const lockfilePath = "C:\\Riot Games\\League of Legends\\lockfile";

  if (!fs.existsSync(lockfilePath)) {
    throw new Error("League client is not running");
  }

  const data = fs.readFileSync(lockfilePath, "utf8");
  const [name, pid, port, password, protocol] = data.split(":");
  return { port, password, protocol };
}

function lcuRequest(path, method = "GET", body) {
  const { port, password } = getLockfile();
  const auth = Buffer.from(`riot:${password}`).toString("base64");

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port,
      path,
      method,
      rejectUnauthorized: false,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (d) => (data += d));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data || "{}");
          if (res.statusCode >= 400) {
            const err = new Error(parsed?.message ?? `HTTP ${res.statusCode}`);
            err.httpStatus = res.statusCode;
            err.errorCode = parsed?.errorCode ?? null;
            err.lcuData = parsed;
            reject(err);
          } else {
            resolve(parsed);
          }
        } catch {
          resolve(data);
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

module.exports = { lcuRequest };
