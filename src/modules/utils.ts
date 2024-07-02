import fs from "fs";
import path from "path";
import url from "url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sleep = async (time = 500) => {
    await new Promise((resolve) => setTimeout(resolve, time));
};

export const updateEnvFile = (key: string, value: string, filename = "../../.env") => {
    const filePath = path.resolve(__dirname, filename);
    const lines = fs.readFileSync(filePath, "utf8").split("\n");
    let keyFound = false;
    const updatedLines = lines.map((line: string) => {
        if (line.startsWith(key + "=")) {
            keyFound = true;
            return `${key}="${value}"`;
        }
        return line;
    });
    if (!keyFound) updatedLines.push(`${key}=${value}`);
    fs.writeFileSync(filePath, updatedLines.join("\n"), "utf8");
    console.log(`Updated ${key} to ${value} in .env file.`);
};
