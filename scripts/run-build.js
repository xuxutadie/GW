const { spawnSync } = require("node:child_process");
const path = require("node:path");

const buildScript = path.join(__dirname, "build.py");
const candidates = process.platform === "win32"
  ? [
      ["py", ["-3", buildScript]],
      ["python", [buildScript]],
      ["python3", [buildScript]]
    ]
  : [
      ["python3", [buildScript]],
      ["python", [buildScript]]
    ];

let lastError = null;

for (const [command, args] of candidates) {
  const result = spawnSync(command, args, { stdio: "inherit" });

  if (result.status === 0) {
    process.exit(0);
  }

  lastError = result.error || new Error(`${command} exited with ${result.status}`);
}

console.error("未能找到可用的 Python 环境来构建网站。");
if (lastError) {
  console.error(lastError.message);
}
process.exit(1);
