// Credit to @webbertakken for the gist:
// https://gist.github.com/webbertakken/ed82572b50f4e166562906757aede40a

import { exec } from "child_process";
import { copy } from "fs-extra";
import { copyFile, readdir, rm, writeFile } from "fs/promises";
import { resolve } from "path";
import readline from "readline";

let manifest = {
  name: "Minimal Theme for Twitter",
  short_name: "Minimal Twitter",
  description: "Refine and declutter the Twitter web experience.",
  version: "5.0.0.3", // alpha version
  icons: {
    16: "images/MinimalTwitterIcon16.png",
    32: "images/MinimalTwitterIcon32.png",
    48: "images/MinimalTwitterIcon48.png",
    128: "images/MinimalTwitterIcon128.png",
  },
  permissions: ["storage"],
  options_ui: {
    page: "index.html",
    open_in_tab: true,
  },
};

const MANIFEST_CHROME = {
  ...manifest,
  manifest_version: 3,
  background: {
    service_worker: "background.js",
    type: "module",
  },
  content_scripts: [
    {
      run_at: "document_end",
      matches: ["https://twitter.com/*", "https://mobile.twitter.com/*"],
      js: ["dist/main.js"],
    },
  ],
  web_accessible_resources: [
    {
      resources: [
        "css/main.css",
        "css/typefully.css",
        "https://cdn.jsdelivr.net/gh/typefully/minimal-twitter@5/css/main.css",
        "https://cdn.jsdelivr.net/gh/typefully/minimal-twitter@5/css/typefully.css",
      ],
      matches: ["https://twitter.com/*", "https://mobile.twitter.com/*"],
    },
  ],
  action: {
    default_icon: {
      16: "images/MinimalTwitterIcon16.png",
      32: "images/MinimalTwitterIcon32.png",
      48: "images/MinimalTwitterIcon48.png",
    },
    default_title: "Minimal Twitter",
    default_popup: "index.html",
  },
};

const MANIFEST_FIREFOX = {
  ...manifest,
  manifest_version: 2,
  browser_specific_settings: {
    gecko: {
      id: "{e7476172-097c-4b77-b56e-f56a894adca9}",
    },
  },
  background: {
    scripts: ["background.js"],
    persistent: false,
  },
  content_scripts: [
    {
      run_at: "document_idle",
      matches: ["https://twitter.com/*", "https://mobile.twitter.com/*"],
      js: ["dist/main.js"],
    },
  ],
  web_accessible_resources: [
    "css/main.css",
    "css/typefully.css",
    "https://cdn.jsdelivr.net/gh/typefully/minimal-twitter@5/css/main.css",
    "https://cdn.jsdelivr.net/gh/typefully/minimal-twitter@5/css/typefully.css",
  ],
  browser_action: {
    default_icon: {
      16: "images/MinimalTwitterIcon16.png",
      32: "images/MinimalTwitterIcon32.png",
      48: "images/MinimalTwitterIcon48.png",
    },
    default_title: "Minimal Twitter",
    default_popup: "index.html",
  },
};

const getFilesInDirectoryRecursively = async (directory) => {
  const dirents = await readdir(directory, { withFileTypes: true });

  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(directory, dirent.name);
      return dirent.isDirectory() ? getFilesInDirectoryRecursively(res) : res;
    })
  );
  return Array.prototype.concat(...files);
};

const bundle = async (manifest, bundleDirectory) => {
  try {
    // Remove old bundle directory
    console.log(`Removing old ${bundleDirectory} directory...`);
    await rm(bundleDirectory, { recursive: true, force: true }); // requires node 14+

    // Bundle popup Next.js export
    console.log(`Moving export to bundle...`);
    await copy("popup/out", `${bundleDirectory}`);

    // Bundle `content-scripts`
    console.log(`Moving content_scripts to bundle...`);
    await copy("content-scripts/dist", `${bundleDirectory}/dist`);

    // Bundle `background.js`
    console.log(`Moving background.js to bundle...`);
    await copyFile("background.js", `${bundleDirectory}/background.js`);

    // Bundle css
    console.log(`Moving css to bundle...`);
    await copy("css", `${bundleDirectory}/css`);

    // Bundle `images`
    console.log(`Moving images to bundle...`);
    await copy("images", `${bundleDirectory}/images`);

    // Create manifest
    await writeFile(
      `${bundleDirectory}/manifest.json`,
      Buffer.from(JSON.stringify(manifest, null, 2)),
      "utf8"
    );

    // Done.
    console.log(`✅ Bundled.`);
  } catch (error) {
    console.error(error);
  }
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const bundleAll = async () => {
  await bundle(MANIFEST_CHROME, "bundle/chrome");
  await bundle(MANIFEST_FIREFOX, "bundle/firefox");
  exec(
    "xcrun safari-web-extension-converter bundle/firefox --project-location bundle/safari",
    (error, stdout, stderr) => {
      console.log(stdout);
      console.log(stderr);
      if (error !== null) {
        console.error(`exec error: ${error}`);
      }
    }
  );
  console.log(`✅ Converted Firefox to Safari.`);
};

rl.question(
  "Which browser would you like to bundle for? [All / Chrome / Firefox / Safari] ",
  async (browser) => {
    switch (browser) {
      case "Chrome":
        await bundle(MANIFEST_CHROME, "bundle/chrome");
        break;

      case "Firefox":
        await bundle(MANIFEST_FIREFOX, "bundle/firefox");
        break;

      case "Safari":
        await bundle(MANIFEST_FIREFOX, "bundle/firefox");
        exec(
          "xcrun safari-web-extension-converter bundle/firefox --project-location bundle/safari",
          (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
              console.error(`exec error: ${error}`);
            }
          }
        );
        console.log(`✅ Converted Firefox to Safari.`);
        break;

      case "All":
        await bundleAll();
        break;

      default:
        await bundleAll();
    }

    rl.close();
  }
);

rl.on("close", () => {
  process.exit(0);
});
