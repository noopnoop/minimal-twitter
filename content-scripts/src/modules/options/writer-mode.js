import selectors from "../../selectors";
import svgAssets from "../svgAssets";
import {
  createTypefullyLinkElement,
  createTypefullyLogo,
  getCurrentTextAndSendToTypefully,
} from "../typefully";
import addStyles from "../utilities/addStyles";
import addTypefullyBox from "../utilities/addTypefullyBox";
import removeElement from "../utilities/removeElement";
import { getStorage, setStorage } from "../utilities/storage";

let t; // Typefully Plug timeout

export const changeWriterMode = (writerMode) => {
  if (
    window.location.pathname.includes("/home") ||
    window.location.pathname === "/"
  ) {
    clearTimeout(t);

    switch (writerMode) {
      case "on":
        document.body.classList.add("mt-writerMode-on");
        addStyles(
          "mt-writerMode",
          `
            body {
              padding-left: 0 !important;
            }
            ${selectors.mainColumn} {
              border-style: hidden !important;
              padding-top: 3vh !important;
              margin: 0 auto;
            }
            ${selectors.mainWrapper} > div {
              width: 100% !important;
              max-width: 100% !important;
            }
            ${selectors.leftSidebar},
            ${selectors.rightSidebar},
            ${selectors.mainColumn} > div > div:not(:nth-of-type(1)):not(:nth-of-type(2)):not(:nth-of-type(3)) {
              display: none !important;
            }
            ${selectors.topHeader} {
              visibility: hidden !important;
            }
            ${selectors.modalWrapper} {
              width: 100vw !important;
              max-width: 100vw !important;
              top: 0 !important;
              border-radius: 0 !important;
            }
            div[role="group"] > div:empty {
              background-color: var(--body-bg-color) !important;
            }
            ${selectors.modalUi} {
              border-radius: 0 !important;
            }
            ${selectors.modalWrapper} > div > div > div {
              padding-bottom: 10vh !important;
            }
            `
        );

        t = setTimeout(() => {
          addTypefullyPlugToWriterMode();
        }, 100);

        break;

      case "off":
        document.body.classList.remove("mt-writerMode-on");
        removeElement("mt-writerMode");
        removeTypefullyPlugFromWriterMode();
        break;
    }
  }
};

export const addTypefullyPlugToWriterMode = async () => {
  if (
    window.location.pathname.includes("/home") ||
    window.location.pathname === "/"
  ) {
    const main = document.querySelector('main[role="main"]');

    if (!main) return;
    if (document.getElementById("typefully-writermode-link")) return;

    /* ---------------------------- Typefully Button ---------------------------- */

    const typefullyLinkElement = createTypefullyLinkElement(
      "typefully-writermode-link",
      "typefully-save-draft-button"
    );
    typefullyLinkElement.addEventListener("click", () => {
      getCurrentTextAndSendToTypefully();
    });

    const typefullyLogo = createTypefullyLogo();
    const typefullyText = document.createElement("span");
    typefullyText.innerText = "Save draft to Typefully";

    typefullyLinkElement.appendChild(typefullyLogo);
    typefullyLinkElement.appendChild(typefullyText);

    /* ----------------- Typefully box callout with explanation ---------------- */

    addTypefullyBox(
      main,
      "writer-mode",
      `<ul>
  <li>💬 Share your drafts and get comments</li>
  <li>🤖 Improve your tweets with AI</li>
  <li>📈 Track your growth with insights and metrics</li>
  <li>📆 Schedule for later</li>
</ul>
<p>Powered by <a href="https://typefully.com/?ref=minimal-twitter">Typefully</a>, the makers of the Minimal Twitter extension.</p>`,
      {
        withArrow: true,
      }
    );

    main.appendChild(typefullyLinkElement);
  }
};

export const removeTypefullyPlugFromWriterMode = () => {
  const typefullyLinkElement = document.getElementById(
    "typefully-writermode-link"
  );
  typefullyLinkElement && typefullyLinkElement.remove();

  const typefullyBox = document.getElementById("typefully-writermode-box");
  typefullyBox && typefullyBox.remove();
};

// Function to add an expand icon to the buttons in the tweet composer
export const addWriterModeButton = async () => {
  if (
    window.location.pathname.includes("/home") ||
    window.location.pathname === "/"
  ) {
    const scheduleButton = document.querySelector(
      'div[data-testid="scheduleOption"]'
    );

    if (!scheduleButton) return;

    const writerModeButton = scheduleButton.cloneNode(true);

    writerModeButton.id = "mt-writer-mode-composer-button";
    writerModeButton.ariaLabel = "Writer Mode";
    writerModeButton.title = "Writer Mode";
    writerModeButton.removeAttribute("data-testid");

    const userSetting = await getStorage("writerMode");
    if (userSetting === "on") {
      writerModeButton.firstChild.firstChild.firstChild.innerHTML =
        svgAssets.composerWriterMode.selected;
    } else {
      writerModeButton.firstChild.firstChild.firstChild.innerHTML =
        svgAssets.composerWriterMode.normal;
    }
    writerModeButton.onclick = toggleWriterMode;

    if (document.querySelector("#mt-writer-mode-composer-button")) {
      writerModeButton.remove();
      return;
    } else {
      scheduleButton.parentNode.appendChild(writerModeButton);

      addStyles(
        "mt-writer-mode-composer-button-style",
        `
    #mt-writer-mode-composer-button:hover {
      background-color: rgba(var(--accent-color-rgb), 0.1);
    }
        `
      );
    }
  }
};

const toggleWriterMode = async () => {
  const userSetting = await getStorage("writerMode");

  const writerModeButton = document.querySelector(
    "#mt-writer-mode-composer-button"
  );

  try {
    await setStorage({ writerMode: userSetting === "off" ? "on" : "off" });
  } catch (error) {
    console.error(error);
  }

  if (!writerModeButton) return;

  if (userSetting === "off") {
    writerModeButton.firstChild.firstChild.firstChild.innerHTML =
      svgAssets.composerWriterMode.selected;
  } else {
    writerModeButton.firstChild.firstChild.firstChild.innerHTML =
      svgAssets.composerWriterMode.normal;

    // scroll body to top
    document.body.scrollTop = 0;
  }
};
