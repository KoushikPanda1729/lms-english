import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const keysDir = path.join(__dirname, "..", "keys");
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

fs.writeFileSync(path.join(keysDir, "private.pem"), privateKey);
fs.writeFileSync(path.join(keysDir, "public.pem"), publicKey);

// Inline format for pasting into .env files (escaped newlines)
const privateInline = privateKey.replace(/\n/g, "\\n");
const publicInline = publicKey.replace(/\n/g, "\\n");

console.log("✅  RSA key pair generated in ./keys/\n");
console.log("📋  Copy these into your .env.development:\n");
console.log(`PRIVATE_KEY="${privateInline}"`);
console.log(`\nPUBLIC_KEY="${publicInline}"`);
console.log("\n⚠️   Never commit keys/private.pem to git.");
