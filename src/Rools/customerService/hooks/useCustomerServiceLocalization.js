import { useEffect } from "react";

import { getLanguage } from "@/shared/i18n";
import { translateCustomerServiceText } from "../constants/customerServiceTranslations";

const TEXT_ATTRIBUTES = ["placeholder", "title", "aria-label"];

export default function useCustomerServiceLocalization() {
  useEffect(() => {
    // Modals and drawers are rendered in portals, so the observer must include
    // document.body as well as the page content referenced by the layout.
    const root = document.body;
    const language = getLanguage();
    if (!root || language !== "ar") return undefined;

    const localize = (target) => {
      if (target.nodeType === Node.TEXT_NODE) {
        const translated = translateCustomerServiceText(target.nodeValue, language);
        if (translated !== target.nodeValue) target.nodeValue = translated;
        return;
      }
      if (!(target instanceof Element)) return;
      TEXT_ATTRIBUTES.forEach((attribute) => {
        if (!target.hasAttribute(attribute)) return;
        const current = target.getAttribute(attribute);
        const translated = translateCustomerServiceText(current, language);
        if (translated !== current) target.setAttribute(attribute, translated);
      });
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const current = walker.currentNode.nodeValue;
        const translated = translateCustomerServiceText(current, language);
        if (translated !== current) walker.currentNode.nodeValue = translated;
      }
      target.querySelectorAll(TEXT_ATTRIBUTES.map((item) => `[${item}]`).join(",")).forEach((element) => {
        TEXT_ATTRIBUTES.forEach((attribute) => {
          if (!element.hasAttribute(attribute)) return;
          const current = element.getAttribute(attribute);
          const translated = translateCustomerServiceText(current, language);
          if (translated !== current) element.setAttribute(attribute, translated);
        });
      });
    };

    localize(root);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") localize(mutation.target);
        mutation.addedNodes.forEach(localize);
      });
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);
}
