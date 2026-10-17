(function () {
  function setTextKeepingChildren(node, value) {
    var textNode = null;
    for (var i = 0; i < node.childNodes.length; i += 1) {
      if (node.childNodes[i].nodeType === Node.TEXT_NODE) {
        textNode = node.childNodes[i];
        break;
      }
    }

    if (!textNode) {
      node.insertBefore(document.createTextNode(value), node.firstChild);
      return;
    }

    var old = textNode.textContent || "";
    var lead = (old.match(/^\s*/) || [""])[0];
    var trail = (old.match(/\s*$/) || [""])[0];
    textNode.textContent = lead + value + trail;
  }

  function getPageKey() {
    var file = window.location.pathname.split("/").pop();
    return file || "index.html";
  }

  function getContentMaps() {
    var siteContent = window.SITE_CONTENT || {};
    var pageKey = getPageKey();
    var pageData = (siteContent.pages && siteContent.pages[pageKey]) || {};

    var sharedCopy = (siteContent.shared && siteContent.shared.copy) || {};
    var pageCopy = pageData.copy || {};
    var copyMap = Object.assign({}, sharedCopy, pageCopy);

    var globalLinks = siteContent.links || {};
    var sharedLinks = (siteContent.shared && siteContent.shared.links) || {};
    var pageLinks = pageData.links || {};
    var linkMap = Object.assign({}, globalLinks, sharedLinks, pageLinks);

    var sharedSelectorCopy =
      (siteContent.shared && siteContent.shared.selectorCopy) || [];
    var pageSelectorCopy = pageData.selectorCopy || [];
    var selectorCopyMap = sharedSelectorCopy.concat(pageSelectorCopy);

    var sharedLiteralText =
      (siteContent.shared && siteContent.shared.literalText) || [];
    var pageLiteralText = pageData.literalText || [];
    var literalTextMap = sharedLiteralText.concat(pageLiteralText);

    var sharedLiteralAttrs =
      (siteContent.shared && siteContent.shared.literalAttrs) || [];
    var pageLiteralAttrs = pageData.literalAttrs || [];
    var literalAttrMap = sharedLiteralAttrs.concat(pageLiteralAttrs);

    return {
      copyMap: copyMap,
      linkMap: linkMap,
      selectorCopyMap: selectorCopyMap,
      literalTextMap: literalTextMap,
      literalAttrMap: literalAttrMap,
      pageKey: pageKey,
    };
  }

  function normalizeLiteral(str) {
    return (str || "").replace(/\s+/g, " ").trim();
  }

  function applyCopy(copyMap, pageKey) {
    var missing = new Set();
    var nodes = document.querySelectorAll("[data-copy-key]");
    nodes.forEach(function (node) {
      var key = node.getAttribute("data-copy-key");
      if (!key) return;
      if (!(key in copyMap)) {
        missing.add(key);
        return;
      }

      var value = copyMap[key];
      if (typeof value !== "string") return;

      var mode = node.getAttribute("data-copy-mode") || "text";
      if (mode === "html") {
        node.innerHTML = value;
      } else if (mode === "text-prefix") {
        setTextKeepingChildren(node, value);
      } else {
        // Default text mode keeps child structure (e.g. title icons) when present.
        if (node.childElementCount > 0) {
          setTextKeepingChildren(node, value);
        } else {
          node.textContent = value;
        }
      }
    });

    if (missing.size > 0) {
      console.warn(
        "[content.apply.shared] Missing copy keys on",
        pageKey,
        Array.from(missing)
      );
    }
  }

  function applyLinks(linkMap, pageKey) {
    var missing = new Set();
    var nodes = document.querySelectorAll("[data-href-key]");
    nodes.forEach(function (node) {
      var key = node.getAttribute("data-href-key");
      if (!key) return;
      if (!(key in linkMap)) {
        missing.add(key);
        return;
      }

      var value = linkMap[key];
      if (typeof value !== "string" || value.length === 0) return;
      node.setAttribute("href", value);
    });

    if (missing.size > 0) {
      console.warn(
        "[content.apply.shared] Missing href keys on",
        pageKey,
        Array.from(missing)
      );
    }
  }

  function applySelectorCopy(copyMap, selectorCopyMap, pageKey) {
    if (!Array.isArray(selectorCopyMap) || selectorCopyMap.length === 0) return;

    var missing = new Set();

    selectorCopyMap.forEach(function (rule) {
      if (!rule || !rule.selector || !rule.key) return;
      if (!(rule.key in copyMap)) {
        missing.add(rule.key);
        return;
      }

      var value = copyMap[rule.key];
      if (typeof value !== "string") return;

      var mode = rule.mode || "text";
      var nodes = document.querySelectorAll(rule.selector);
      if (!nodes || nodes.length === 0) return;

      var targets = rule.all ? Array.from(nodes) : [nodes[0]];
      targets.forEach(function (node) {
        if (mode === "html") {
          node.innerHTML = value;
        } else if (mode === "text-prefix") {
          setTextKeepingChildren(node, value);
        } else {
          if (node.childElementCount > 0) {
            setTextKeepingChildren(node, value);
          } else {
            node.textContent = value;
          }
        }
      });
    });

    if (missing.size > 0) {
      console.warn(
        "[content.apply.shared] Missing selector copy keys on",
        pageKey,
        Array.from(missing)
      );
    }
  }

  function applyLiteralTextRules(literalTextMap) {
    if (!Array.isArray(literalTextMap) || literalTextMap.length === 0) return;

    var byFrom = new Map();
    literalTextMap.forEach(function (rule) {
      if (!rule || typeof rule.from !== "string" || typeof rule.to !== "string") return;
      var from = normalizeLiteral(rule.from);
      if (!from) return;
      byFrom.set(from, rule.to);
    });
    if (byFrom.size === 0) return;

    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      if (!node || !node.parentElement) continue;
      var parentTag = node.parentElement.tagName;
      if (
        parentTag === "SCRIPT" ||
        parentTag === "STYLE" ||
        parentTag === "TEMPLATE" ||
        parentTag === "NOSCRIPT"
      ) {
        continue;
      }

      var oldText = node.textContent || "";
      var normalized = normalizeLiteral(oldText);
      if (!normalized || !byFrom.has(normalized)) continue;

      var replacement = byFrom.get(normalized);
      var lead = (oldText.match(/^\s*/) || [""])[0];
      var trail = (oldText.match(/\s*$/) || [""])[0];
      node.textContent = lead + replacement + trail;
    }
  }

  function applyLiteralAttrRules(literalAttrMap) {
    if (!Array.isArray(literalAttrMap) || literalAttrMap.length === 0) return;

    var byAttr = {};
    literalAttrMap.forEach(function (rule) {
      if (
        !rule ||
        typeof rule.attr !== "string" ||
        typeof rule.from !== "string" ||
        typeof rule.to !== "string"
      ) {
        return;
      }

      var attr = rule.attr.toLowerCase();
      var from = normalizeLiteral(rule.from);
      if (!attr || !from) return;

      if (!byAttr[attr]) byAttr[attr] = new Map();
      byAttr[attr].set(from, rule.to);
    });

    Object.keys(byAttr).forEach(function (attr) {
      var nodes = document.querySelectorAll("[" + attr + "]");
      nodes.forEach(function (node) {
        var oldVal = node.getAttribute(attr) || "";
        var normalized = normalizeLiteral(oldVal);
        if (!normalized) return;
        var mapped = byAttr[attr].get(normalized);
        if (typeof mapped !== "string") return;
        node.setAttribute(attr, mapped);
      });
    });
  }

  function init() {
    var maps = getContentMaps();
    applyLiteralTextRules(maps.literalTextMap);
    applyLiteralAttrRules(maps.literalAttrMap);
    applyCopy(maps.copyMap, maps.pageKey);
    applySelectorCopy(maps.copyMap, maps.selectorCopyMap, maps.pageKey);
    applyLinks(maps.linkMap, maps.pageKey);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
