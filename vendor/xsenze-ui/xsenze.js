/*! Xsenze UI Kit v0.10.0 | MIT */
var Xsenze = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target2, all) => {
    for (var name in all)
      __defProp(target2, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/js/index.js
  var index_exports = {};
  __export(index_exports, {
    default: () => index_default
  });

  // src/js/icons.generated.js
  var icons_generated_default = { "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', "arrow-up": '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>', "arrow-down": '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>', "arrow-up-right": '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>', "arrow-up-down": '<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>', "chevron-down": '<path d="m6 9 6 6 6-6"/>', "chevron-up": '<path d="m18 15-6-6-6 6"/>', "chevron-left": '<path d="m15 18-6-6 6-6"/>', "chevron-right": '<path d="m9 18 6-6-6-6"/>', "chevrons-up-down": '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>', "chevrons-left": '<path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/>', "chevrons-right": '<path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/>', "check": '<path d="M20 6 9 17l-5-5"/>', "x": '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', "plus": '<path d="M5 12h14"/><path d="M12 5v14"/>', "minus": '<path d="M5 12h14"/>', "search": '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>', "menu": '<path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/>', "ellipsis": '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>', "ellipsis-vertical": '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>', "eye": '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>', "eye-off": '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>', "pencil": '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>', "trash-2": '<path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>', "copy": '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>', "download": '<path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/>', "upload": '<path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>', "external-link": '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>', "link": '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>', "filter": '<path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/>', "sliders-horizontal": '<path d="M10 5H3"/><path d="M12 19H3"/><path d="M14 3v4"/><path d="M16 17v4"/><path d="M21 12h-9"/><path d="M21 19h-5"/><path d="M21 5h-7"/><path d="M8 10v4"/><path d="M8 12H3"/>', "settings": '<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/>', "user": '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>', "house": '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', "layout-dashboard": '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>', "bell": '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>', "mail": '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/>', "lock": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', "log-out": '<path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>', "log-in": '<path d="m10 17 5-5-5-5"/><path d="M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>', "calendar": '<path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>', "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', "info": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>', "circle-alert": '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>', "triangle-alert": '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>', "circle-check": '<circle cx="12" cy="12" r="10"/><path d="m16 9-5.5 5.5L8 12"/>', "circle-x": '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>', "circle-help": '<circle cx="12" cy="12" r="10"/><path d="M9 9.5a3 2.5 0 016 0c0 2-2 2-3 3.5"/><path d="M12 17h.01"/>', "star": '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>', "heart": '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>', "file-text": '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>', "folder": '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>', "image": '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>', "inbox": '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>', "book-open": '<path d="M12 5v16"/><path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"/>', "graduation-cap": '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>', "briefcase": '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>', "chart-column": '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>', "trending-up": '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>', "trending-down": '<path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/>', "indian-rupee": '<path d="m14 20-8-8h4c5.333 0 5.333-8 0-8"/><path d="M6 4h12"/><path d="M6 8h12"/>', "wallet": '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>', "credit-card": '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><path d="M6 14h2"/>', "phone": '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>', "map-pin": '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>', "globe": '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>', "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>', "moon": '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>', "loader-circle": '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>', "refresh-cw": '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>', "panel-left": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>', "share-2": '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>', "tag": '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>', "building-2": '<path d="M10 12h4"/><path d="M10 8h4"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>', "shield-check": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>', "zap": '<path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"/>', "package": '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/><path d="m7.5 4.27 9 5.15"/>', "terminal": '<path d="M12 19h8"/><path d="m4 17 6-6-6-6"/>', "code": '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>', "palette": '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>', "layers": '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>', "layout-grid": '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>', "type": '<path d="M12 4v16"/><path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2"/><path d="M9 20h6"/>', "accessibility": '<circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/>', "component": '<path d="M15.536 11.293a1 1 0 0 0 0 1.414l2.376 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/><path d="M2.297 11.293a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414L6.088 8.916a1 1 0 0 0-1.414 0z"/><path d="M8.916 17.912a1 1 0 0 0 0 1.415l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.415l-2.377-2.376a1 1 0 0 0-1.414 0z"/><path d="M8.916 4.674a1 1 0 0 0 0 1.414l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/>', "languages": '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>', "table-2": '<path d="M3 9h18"/><path d="M9 3v18"/><rect x="3" y="3" width="18" height="18" rx="2"/>', "square-check": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m16 9-5.5 5.5L8 12"/>', "toggle-left": '<circle cx="9" cy="12" r="3"/><rect width="20" height="14" x="2" y="5" rx="7"/>', "message-square": '<path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/>', "paperclip": '<path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"/>', "save": '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>', "printer": '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>', "key-round": '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>', "badge-check": '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m16 9-5.5 5.5L8 12"/>', "receipt": '<path d="M12 17V7"/><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8"/><path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"/>', "clipboard-list": '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>', "file-warning": '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M12 9v4"/><path d="M12 17h.01"/>', "server-crash": '<path d="M6 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M6 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2"/><path d="M6 6h.01"/><path d="M6 18h.01"/><path d="m13 6-4 6h6l-4 6"/>', "compass": '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>', "bold": '<path d="M6 12h9a4 4 0 010 8H7a1 1 0 01-1-1V5a1 1 0 011-1h7a4 4 0 010 8"/>', "italic": '<line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/>', "underline": '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" x2="20" y1="20" y2="20"/>', "list": '<path d="M3 5h.01"/><path d="M3 12h.01"/><path d="M3 19h.01"/><path d="M8 5h13"/><path d="M8 12h13"/><path d="M8 19h13"/>', "list-ordered": '<path d="M11 5h10"/><path d="M11 12h10"/><path d="M11 19h10"/><path d="M4 4h1v5"/><path d="M4 9h2"/><path d="M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02"/>', "undo-2": '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>', "redo-2": '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13"/>', "heading": '<path d="M18 20V4"/><path d="M6 12H18"/><path d="M6 20V4"/>', "cloud-upload": '<path d="M12 13v8"/><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="m8 17 4-4 4 4"/>', "calendar-range": '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M16 2v3"/><path d="M3 9h18"/><path d="M8 2v3"/><path d="M17 13h-6"/><path d="M13 17H7"/><path d="M7 13h.01"/><path d="M17 17h.01"/>', "play": '<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>', "pause": '<rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/>', "volume-2": '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>', "volume-x": '<path d="M11 4.702a.7.7 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.7.7 0 0 0 11 19.298z"/><path d="m16.5 14.5 5-5"/><path d="m16.5 9.5 5 5"/>', "maximize": '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>', "minimize": '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>', "history": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>', "check-check": '<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>', "bell-dot": '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M11.68 2.009A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673c-.824-.85-1.678-1.731-2.21-3.348"/><circle cx="18" cy="5" r="3"/>', "images": '<path d="m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16"/><path d="M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2"/><circle cx="13" cy="7" r="1" fill="currentColor"/><rect x="8" y="2" width="14" height="14" rx="2"/>', "crown": '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>', "smartphone": '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>', "lock-open": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>', "shuffle": '<path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22"/><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"/><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"/>', "command": '<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/>', "list-filter": '<path d="M2 5h20"/><path d="M6 12h12"/><path d="M9 19h6"/>', "columns-3": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/>', "chart-line": '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/>', "chart-pie": '<path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>', "monitor": '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>', "tablet": '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/>', "rotate-cw": '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>', "quote": '<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>', "bot": '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>', "send": '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>', "thumbs-up": '<path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/><path d="M7 10v12"/>', "thumbs-down": '<path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/><path d="M17 14V2"/>', "flag": '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/>', "timer": '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>', "list-checks": '<path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/>', "folder-open": '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>', "file": '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/>', "square": '<rect width="18" height="18" x="3" y="3" rx="2"/>', "mic": '<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>', "video": '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>', "radio": '<path d="M16.247 7.761a6 6 0 0 1 0 8.478"/><path d="M19.075 4.933a10 10 0 0 1 0 14.134"/><path d="M4.925 19.067a10 10 0 0 1 0-14.134"/><path d="M7.753 16.239a6 6 0 0 1 0-8.478"/><circle cx="12" cy="12" r="2"/>', "circle-dot": '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="12" r="10"/>', "contrast": '<circle cx="12" cy="12" r="10"/><path d="M12 18a6 6 0 0 0 0-12v12z"/>', "sigma": '<path d="M18 7V5a1 1 0 0 0-1-1H6.5a.5.5 0 0 0-.4.8l4.5 6a2 2 0 0 1 0 2.4l-4.5 6a.5.5 0 0 0 .4.8H17a1 1 0 0 0 1-1v-2"/>', "ruler": '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>', "clipboard-paste": '<path d="M11 14h10"/><path d="M16 4h2a2 2 0 0 1 2 2v1.344"/><path d="m17 18 4-4-4-4"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 1.793-1.113"/><rect x="8" y="2" width="8" height="4" rx="1"/>', "keyboard": '<path d="M10 8h.01"/><path d="M12 12h.01"/><path d="M14 8h.01"/><path d="M16 12h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M7 16h10"/><path d="M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/>', "rotate-ccw": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>', "award": '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>' };

  // src/js/format.js
  var format_exports = {};
  __export(format_exports, {
    compact: () => compact,
    date: () => date,
    dateShort: () => dateShort,
    dateTime: () => dateTime,
    financialYear: () => financialYear,
    inr: () => inr,
    inrCompact: () => inrCompact,
    number: () => number,
    parse: () => parse,
    percent: () => percent,
    phone: () => phone,
    relative: () => relative,
    time: () => time,
    unit: () => unit
  });
  var LOCALE = "en-IN";
  var toDate = (d) => d instanceof Date ? d : new Date(d);
  var trim = (n, digits) => String(Number(n.toFixed(digits)));
  function number(value, { decimals } = {}) {
    return new Intl.NumberFormat(LOCALE, decimals === void 0 ? { maximumFractionDigits: 2 } : { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  }
  function inr(value, { decimals } = {}) {
    const hasPaise = Math.round(value * 100) % 100 !== 0;
    const d = decimals != null ? decimals : hasPaise ? 2 : 0;
    const sign = value < 0 ? "\u2212" : "";
    return `${sign}\u20B9${number(Math.abs(value), { decimals: d })}`;
  }
  function compact(value, { digits = 2 } = {}) {
    const abs = Math.abs(value);
    const sign = value < 0 ? "\u2212" : "";
    if (abs >= 1e7) return `${sign}${trim(abs / 1e7, digits)} Cr`;
    if (abs >= 1e5) return `${sign}${trim(abs / 1e5, digits)} L`;
    return `${sign}${number(abs, { decimals: 0 })}`;
  }
  function inrCompact(value, options) {
    const sign = value < 0 ? "\u2212" : "";
    return `${sign}\u20B9${compact(Math.abs(value), options)}`;
  }
  function unit(value) {
    const abs = Math.abs(value);
    return abs >= 1e7 ? "crore" : abs >= 1e5 ? "lakh" : abs >= 1e3 ? "thousand" : "";
  }
  function percent(value, { digits = 1 } = {}) {
    return `${trim(value * 100, digits)}%`;
  }
  function date(value) {
    return new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric" }).format(toDate(value));
  }
  function dateShort(value) {
    return new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric" }).format(toDate(value));
  }
  function dateTime(value) {
    return new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).format(toDate(value));
  }
  function time(value) {
    return new Intl.DateTimeFormat(LOCALE, { hour: "numeric", minute: "2-digit", hour12: true }).format(toDate(value));
  }
  function relative(value, now = /* @__PURE__ */ new Date()) {
    const diff = (toDate(value) - toDate(now)) / 1e3;
    const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
    for (const [unitName, seconds] of [["year", 31536e3], ["month", 2592e3], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]]) {
      if (Math.abs(diff) >= seconds) return rtf.format(Math.round(diff / seconds), unitName);
    }
    return "just now";
  }
  function financialYear(value = /* @__PURE__ */ new Date()) {
    const d = toDate(value);
    const start = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
    return `FY ${start}-${String((start + 1) % 100).padStart(2, "0")}`;
  }
  function parse(value) {
    if (typeof value === "number") return value;
    const s = String(value != null ? value : "").trim();
    const m = s.replace(/,/g, "").match(/([−-]?)\s*[₹$]?\s*(\d+(?:\.\d+)?|\.\d+)\s*(cr|crore|l|lakh|lac|k|%)?/i);
    if (!m) return NaN;
    const scale = { cr: 1e7, crore: 1e7, l: 1e5, lakh: 1e5, lac: 1e5, k: 1e3, "%": 0.01 }[(m[3] || "").toLowerCase()] || 1;
    const sign = m[1] || /^[−-]/.test(s) ? -1 : 1;
    return sign * Number(m[2]) * scale;
  }
  function phone(value) {
    const digits = String(value).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");
    return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : String(value);
  }

  // src/js/place.js
  var viewport = () => ({ vw: document.documentElement.clientWidth, vh: document.documentElement.clientHeight });
  function reset(panel) {
    panel.style.position = "fixed";
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    panel.style.left = "0px";
    panel.style.top = "0px";
    return panel.getBoundingClientRect();
  }
  function place(panel, anchor, { align = "start", gap = 4 } = {}) {
    const a = anchor.getBoundingClientRect();
    const { vw, vh } = viewport();
    const p = reset(panel);
    const below = a.bottom + gap;
    const top = below + p.height <= vh - 8 || a.top - gap - p.height < 8 ? below : a.top - gap - p.height;
    const left = align === "end" ? a.right - p.width : a.left;
    panel.style.left = `${Math.max(8, Math.min(left, vw - p.width - 8))}px`;
    panel.style.top = `${Math.max(8, top)}px`;
  }
  function placeAt(panel, x, y) {
    const { vw, vh } = viewport();
    const p = reset(panel);
    panel.style.left = `${Math.max(8, Math.min(x, vw - p.width - 8))}px`;
    const top = y + p.height > vh - 8 ? y - p.height : y;
    panel.style.top = `${Math.max(8, Math.min(top, vh - p.height - 8))}px`;
  }

  // src/js/dates.js
  var pad = (n) => String(n).padStart(2, "0");
  var toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  var fromIso = (s) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  };
  var showDate = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  function parseDate(text) {
    const m = /^\s*(\d{1,2})[/.\-\s](\d{1,2})[/.\-\s](\d{2}|\d{4})\s*$/.exec(text);
    if (!m) return null;
    const year = m[3].length === 2 ? 2e3 + Number(m[3]) : Number(m[3]);
    const d = new Date(year, Number(m[2]) - 1, Number(m[1]));
    return d.getDate() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 ? d : null;
  }
  var addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  var sameDay = (a, b) => a && b && a.getTime() === b.getTime();
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function monthDays(year, month, weekStart = 1) {
    const first = new Date(year, month, 1);
    const lead = (first.getDay() - weekStart + 7) % 7;
    const start = addDays(first, -lead);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }

  // src/js/forms-advanced.js
  var $$ = (sel, root2 = document) => Array.from(root2.querySelectorAll(sel));
  var ready = (el) => {
    if (el.dataset.xzReady) return true;
    el.dataset.xzReady = "1";
    return false;
  };
  var fire = (el, type, detail) => el.dispatchEvent(new CustomEvent(type, { bubbles: true, detail }));
  var changed = (el) => {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };
  var esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var uid = 0;
  var openPanel = null;
  var globalBound = false;
  function bindGlobal() {
    if (globalBound) return;
    globalBound = true;
    document.addEventListener("pointerdown", (e) => {
      if (openPanel && !openPanel.el.contains(e.target)) openPanel.close();
    });
    addEventListener("resize", () => openPanel == null ? void 0 : openPanel.close());
    document.addEventListener("scroll", (e) => openPanel && !openPanel.el.contains(e.target) && openPanel.close(), true);
  }
  function initSliders(root2) {
    for (const el of $$('input[type="range"].xz-slider', root2)) {
      if (ready(el)) continue;
      const out = el.id ? document.querySelector(`output[for="${el.id}"]`) : null;
      const paint = () => {
        const min = Number(el.min || 0);
        const max = Number(el.max || 100);
        el.style.setProperty("--_fill", `${max > min ? (el.value - min) / (max - min) * 100 : 0}%`);
        if (out) out.textContent = (el.dataset.xzPrefix || "") + Number(el.value).toLocaleString("en-IN") + (el.dataset.xzSuffix || "");
      };
      el.addEventListener("input", paint);
      paint();
    }
  }
  function initSteppers(root2) {
    for (const el of $$("[data-xz-stepper]", root2)) {
      if (ready(el)) continue;
      const input = el.querySelector("input");
      if (!input) continue;
      const buttons = $$("[data-xz-step]", el);
      const sync = () => {
        const value = Number(input.value);
        for (const btn of buttons) {
          const dir = Number(btn.dataset.xzStep);
          btn.disabled = input.disabled || dir < 0 && input.min !== "" && value <= Number(input.min) || dir > 0 && input.max !== "" && value >= Number(input.max);
        }
      };
      el.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-xz-step]");
        if (!btn) return;
        if (input.value === "") input.value = input.min || "0";
        else if (Number(btn.dataset.xzStep) > 0) input.stepUp();
        else input.stepDown();
        changed(input);
      });
      input.addEventListener("input", sync);
      sync();
    }
  }
  function initOtps(root2) {
    for (const el of $$("[data-xz-otp]", root2)) {
      if (ready(el)) continue;
      const cells = $$(".xz-otp__cell", el);
      const hidden = el.querySelector('input[type="hidden"]');
      for (const c of cells) c.maxLength = cells.length;
      const sync = () => {
        const value = cells.map((c) => c.value).join("");
        if (hidden) hidden.value = value;
        if (value.length === cells.length) fire(el, "xz:otp-complete", { value });
      };
      const spread = (text, from) => {
        const digits = text.replace(/\D/g, "").slice(0, cells.length - from).split("");
        digits.forEach((d, i) => cells[from + i].value = d);
        cells[Math.min(from + digits.length, cells.length - 1)].focus();
        sync();
      };
      cells.forEach((cell, i) => {
        cell.addEventListener("input", () => {
          const digits = cell.value.replace(/\D/g, "");
          cell.value = "";
          if (digits.length > 1) return spread(digits, i);
          cell.value = digits;
          if (digits && i < cells.length - 1) cells[i + 1].focus();
          sync();
        });
        cell.addEventListener("keydown", (e) => {
          if (e.key === "Backspace" && !cell.value && i > 0) {
            e.preventDefault();
            cells[i - 1].value = "";
            cells[i - 1].focus();
            sync();
          } else if (e.key === "ArrowLeft" && i > 0) {
            e.preventDefault();
            cells[i - 1].focus();
          } else if (e.key === "ArrowRight" && i < cells.length - 1) {
            e.preventDefault();
            cells[i + 1].focus();
          }
        });
        cell.addEventListener("paste", (e) => {
          e.preventDefault();
          spread(e.clipboardData.getData("text"), i);
        });
        cell.addEventListener("focus", () => cell.select());
      });
    }
  }
  function initTagInputs(root2, icon4) {
    for (const el of $$("[data-xz-tag-input]", root2)) {
      if (ready(el)) continue;
      const field = el.querySelector(".xz-tag-input__field");
      const hidden = el.querySelector('input[type="hidden"]');
      if (!field) continue;
      let list = el.querySelector(".xz-tag-input__list");
      if (!list) {
        list = Object.assign(document.createElement("ul"), { className: "xz-tag-input__list" });
        el.prepend(list);
      }
      const live2 = Object.assign(document.createElement("span"), { className: "xz-sr-only" });
      live2.setAttribute("aria-live", "polite");
      el.append(live2);
      const max = Number(el.dataset.xzMax) || Infinity;
      let tags = ((hidden == null ? void 0 : hidden.value) || "").split(",").map((s) => s.trim()).filter(Boolean);
      const render = () => {
        list.innerHTML = tags.map((t, i) => `<li><span class="xz-chip">${esc(t)}<button type="button" class="xz-chip__remove" data-index="${i}" aria-label="Remove ${esc(t)}">${icon4("x", { size: "xs" })}</button></span></li>`).join("");
        if (hidden) hidden.value = tags.join(",");
        fire(el, "xz:tags", { tags: [...tags] });
      };
      const add = (raw) => {
        for (const part of raw.split(",")) {
          const tag = part.trim();
          if (!tag) continue;
          if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) live2.textContent = `${tag} is already in the list`;
          else if (tags.length >= max) {
            live2.textContent = `You can add up to ${max}`;
            el.classList.add("is-invalid");
            break;
          } else {
            tags.push(tag);
            live2.textContent = `${tag} added`;
          }
        }
        render();
      };
      field.addEventListener("keydown", (e) => {
        el.classList.remove("is-invalid");
        if ((e.key === "Enter" || e.key === ",") && field.value.trim()) {
          e.preventDefault();
          add(field.value);
          field.value = "";
        } else if (e.key === "Backspace" && !field.value && tags.length) {
          live2.textContent = `${tags.pop()} removed`;
          render();
        }
      });
      field.addEventListener("input", () => {
        if (!field.value.includes(",")) return;
        add(field.value);
        field.value = "";
      });
      field.addEventListener("blur", () => {
        if (!field.value.trim()) return;
        add(field.value);
        field.value = "";
      });
      el.addEventListener("click", (e) => {
        const remove = e.target.closest(".xz-chip__remove");
        if (remove) {
          live2.textContent = `${tags.splice(Number(remove.dataset.index), 1)[0]} removed`;
          el.classList.remove("is-invalid");
          render();
        }
        field.focus();
      });
      render();
    }
  }
  var fileSize = (bytes) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  function initDropzones(root2, icon4) {
    for (const el of $$("[data-xz-dropzone]", root2)) {
      if (ready(el)) continue;
      const input = el.querySelector('input[type="file"]');
      if (!input) continue;
      let list = el.querySelector(".xz-dropzone__list");
      if (!list) {
        list = Object.assign(document.createElement("ul"), { className: "xz-dropzone__list" });
        el.append(list);
      }
      list.setAttribute("aria-live", "polite");
      const maxMb = Number(el.dataset.xzMaxSize) || 0;
      const maxFiles = Number(el.dataset.xzMaxFiles) || Infinity;
      let files = [];
      let rejected = [];
      const accepts = (file) => {
        const rules = (input.accept || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
        const name = file.name.toLowerCase();
        const type = file.type.toLowerCase();
        return !rules.length || rules.some((r) => r.startsWith(".") ? name.endsWith(r) : r.endsWith("/*") ? type.startsWith(r.slice(0, -1)) : type === r);
      };
      const render = () => {
        list.innerHTML = files.map((f, i) => `<li class="xz-dropzone__file">${icon4("file-text", { size: "sm" })}<span class="xz-dropzone__name">${esc(f.name)}</span><span class="xz-dropzone__meta">${fileSize(f.size)}</span><button type="button" class="xz-btn xz-btn--ghost xz-btn--icon xz-btn--sm" data-index="${i}" aria-label="Remove ${esc(f.name)}">${icon4("x", { size: "sm" })}</button></li>`).join("") + rejected.map(([f, why]) => `<li class="xz-dropzone__file is-error">${icon4("circle-alert", { size: "sm" })}<span class="xz-dropzone__name">${esc(f.name)}</span><span class="xz-dropzone__meta">${esc(why)}</span></li>`).join("");
      };
      const commit = () => {
        const dt = new DataTransfer();
        for (const f of files) dt.items.add(f);
        input.files = dt.files;
        render();
        fire(el, "xz:files", { files: [...files], rejected: rejected.map(([f, why]) => ({ file: f, reason: why })) });
      };
      const take = (incoming) => {
        rejected = [];
        for (const f of incoming) {
          if (!accepts(f)) rejected.push([f, "This file type is not allowed"]);
          else if (maxMb && f.size > maxMb * 1024 * 1024) rejected.push([f, `Larger than ${maxMb} MB`]);
          else if (!input.multiple) files = [f];
          else if (files.some((x) => x.name === f.name && x.size === f.size)) continue;
          else if (files.length >= maxFiles) rejected.push([f, `Only ${maxFiles} files can be added`]);
          else files.push(f);
        }
        commit();
      };
      input.addEventListener("change", () => take([...input.files]));
      for (const type of ["dragenter", "dragover"]) {
        el.addEventListener(type, (e) => {
          e.preventDefault();
          el.classList.add("is-dragover");
        });
      }
      el.addEventListener("dragleave", (e) => !el.contains(e.relatedTarget) && el.classList.remove("is-dragover"));
      el.addEventListener("drop", (e) => {
        e.preventDefault();
        el.classList.remove("is-dragover");
        take([...e.dataTransfer.files]);
      });
      list.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-index]");
        if (!btn) return;
        files.splice(Number(btn.dataset.index), 1);
        rejected = [];
        commit();
        input.focus();
      });
      el.xzDropzone = {
        clear() {
          files = [];
          rejected = [];
          commit();
        }
      };
    }
  }
  function initDatepickers(root2, icon4) {
    var _a, _b, _c;
    for (const el of $$("[data-xz-datepicker]", root2)) {
      if (ready(el)) continue;
      const range = el.dataset.xzDatepicker === "range";
      const many = el.dataset.xzDatepicker === "multiple";
      const inline = el.hasAttribute("data-xz-inline");
      const input = el.querySelector('input:not([type="hidden"])');
      const trigger = el.querySelector("button");
      const hidden = $$('input[type="hidden"]', el);
      if (!input && !inline) continue;
      const picks = new Set(many ? (((_a = hidden[0]) == null ? void 0 : _a.value) || "").split(",").map((s) => s.trim()).filter((s) => fromIso(s)) : []);
      const min = fromIso(el.dataset.xzMin);
      const max = fromIso(el.dataset.xzMax);
      const weekStart = el.dataset.xzWeekStart === "0" ? 0 : 1;
      const now = /* @__PURE__ */ new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const clamp2 = (d) => min && d < min ? min : max && d > max ? max : d;
      const off = (d) => min && d < min || max && d > max;
      let start = fromIso((_b = hidden[0]) == null ? void 0 : _b.value);
      let end = range ? fromIso((_c = hidden[1]) == null ? void 0 : _c.value) : null;
      let cursor = clamp2(start || today);
      const panel = document.createElement("div");
      panel.className = "xz-picker xz-calendar";
      panel.hidden = !inline;
      panel.setAttribute("role", inline ? "group" : "dialog");
      panel.setAttribute("aria-label", range || many ? "Choose dates" : "Choose a date");
      el.classList.toggle("xz-datepicker--inline", inline);
      el.append(panel);
      input == null ? void 0 : input.setAttribute("autocomplete", "off");
      if (many && input) input.readOnly = true;
      trigger == null ? void 0 : trigger.setAttribute("aria-haspopup", "dialog");
      trigger == null ? void 0 : trigger.setAttribute("aria-expanded", "false");
      const write = () => {
        if (many) {
          const list = [...picks].sort();
          if (hidden[0]) hidden[0].value = list.join(",");
          if (input) input.value = list.length === 1 ? showDate(fromIso(list[0])) : list.length ? `${list.length} dates` : "";
          return fire(el, "xz:date", { dates: list });
        }
        if (input) input.value = start ? showDate(start) + (range && end ? ` \u2013 ${showDate(end)}` : "") : "";
        if (hidden[0]) hidden[0].value = start ? toIso(start) : "";
        if (range && hidden[1]) hidden[1].value = end ? toIso(end) : "";
        input == null ? void 0 : input.removeAttribute("aria-invalid");
        fire(el, "xz:date", { start: start ? toIso(start) : "", end: end ? toIso(end) : "" });
      };
      const draw = () => {
        const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        const lead = (first.getDay() - weekStart + 7) % 7;
        let rows = "";
        for (let w = 0; w < 6; w++) {
          rows += "<tr>";
          for (let i = 0; i < 7; i++) {
            const d = addDays(first, w * 7 + i - lead);
            const selected = many ? picks.has(toIso(d)) : sameDay(d, start) || sameDay(d, end);
            const cls = ["xz-calendar__day", d.getMonth() !== cursor.getMonth() && "is-outside", sameDay(d, today) && "is-today", range && start && end && d > start && d < end && "is-in-range"].filter(Boolean).join(" ");
            rows += `<td role="gridcell"><button type="button" class="${cls}" data-date="${toIso(d)}" tabindex="${sameDay(d, cursor) ? 0 : -1}" aria-label="${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${DAYS[d.getDay()]}"${selected ? ' aria-selected="true"' : ""}${off(d) ? " disabled" : ""}>${d.getDate()}</button></td>`;
          }
          rows += "</tr>";
        }
        const heads = Array.from({ length: 7 }, (_, i) => DAYS[(i + weekStart) % 7]).map((n) => `<th scope="col"><abbr title="${n}" style="text-decoration:none">${n.slice(0, 2)}</abbr></th>`).join("");
        const hint = range ? start && !end ? "Now pick the end date" : "Pick the start date" : many ? picks.size ? `${picks.size} chosen` : "Pick one or more dates" : "";
        panel.innerHTML = `
        <div class="xz-calendar__header">
          <button type="button" class="xz-btn xz-btn--ghost xz-btn--icon xz-btn--sm" data-nav="-1" aria-label="Previous month">${icon4("chevron-left", { size: "sm" })}</button>
          <div class="xz-calendar__title" aria-live="polite">${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}</div>
          <button type="button" class="xz-btn xz-btn--ghost xz-btn--icon xz-btn--sm" data-nav="1" aria-label="Next month">${icon4("chevron-right", { size: "sm" })}</button>
        </div>
        <table class="xz-calendar__grid" role="grid"><thead><tr>${heads}</tr></thead><tbody>${rows}</tbody></table>
        <div class="xz-calendar__footer">
          <button type="button" class="xz-btn xz-btn--ghost xz-btn--sm" data-today${off(today) ? " disabled" : ""}>Today</button>
          <span class="xz-calendar__hint">${hint}</span>
          <button type="button" class="xz-btn xz-btn--ghost xz-btn--sm" data-clear>Clear</button>
        </div>`;
      };
      const focusCursor = () => {
        var _a2;
        return (_a2 = panel.querySelector('[tabindex="0"]')) == null ? void 0 : _a2.focus({ preventScroll: true });
      };
      const api = {
        el,
        close(focus) {
          if (inline || panel.hidden) return;
          panel.hidden = true;
          trigger == null ? void 0 : trigger.setAttribute("aria-expanded", "false");
          if (openPanel === api) openPanel = null;
          if (focus) (trigger || input).focus({ preventScroll: true });
        }
      };
      const open = () => {
        openPanel == null ? void 0 : openPanel.close();
        cursor = clamp2(start || today);
        draw();
        panel.hidden = false;
        place(panel, input.closest(".xz-input-group") || input);
        trigger == null ? void 0 : trigger.setAttribute("aria-expanded", "true");
        openPanel = api;
        focusCursor();
      };
      const stay = () => {
        draw();
        focusCursor();
      };
      const choose = (d) => {
        if (off(d)) return;
        cursor = d;
        if (many) {
          const k = toIso(d);
          if (!picks.delete(k)) picks.add(k);
          write();
          return stay();
        }
        if (!range) {
          start = d;
          write();
          return inline ? stay() : api.close(true);
        }
        if (!start || end) [start, end] = [d, null];
        else if (d < start) start = d;
        else end = d;
        write();
        if (end && !inline) return api.close(true);
        stay();
      };
      trigger == null ? void 0 : trigger.addEventListener("click", () => panel.hidden ? open() : api.close(true));
      input == null ? void 0 : input.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" && !inline) {
          e.preventDefault();
          open();
        }
      });
      input == null ? void 0 : input.addEventListener("change", () => {
        if (many) return;
        const text = input.value.trim();
        if (!text) {
          [start, end] = [null, null];
          return write();
        }
        const parts = range ? text.split(/\s+(?:–|—|-|to)\s+|–|—/) : [text];
        const a = parseDate(parts[0] || "");
        const b = range && parts[1] ? parseDate(parts[1]) : null;
        if (!a || off(a) || range && parts[1] && (!b || off(b) || b < a) || parts.length > 2) return input.setAttribute("aria-invalid", "true");
        [start, end] = [a, b];
        write();
      });
      panel.addEventListener("click", (e) => {
        const day = e.target.closest("[data-date]");
        const nav = e.target.closest("[data-nav]");
        if (day) choose(fromIso(day.dataset.date));
        else if (nav) {
          cursor = clamp2(new Date(cursor.getFullYear(), cursor.getMonth() + Number(nav.dataset.nav), 1));
          draw();
          panel.querySelector(`[data-nav="${nav.dataset.nav}"]`).focus({ preventScroll: true });
        } else if (e.target.closest("[data-today]")) choose(today);
        else if (e.target.closest("[data-clear]")) {
          [start, end] = [null, null];
          picks.clear();
          write();
          if (inline) draw();
          else api.close(true);
        }
      });
      panel.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !inline) {
          e.stopPropagation();
          return api.close(true);
        }
        if (!e.target.closest("[data-date]")) return;
        const dow = (cursor.getDay() - weekStart + 7) % 7;
        const next = { ArrowLeft: addDays(cursor, -1), ArrowRight: addDays(cursor, 1), ArrowUp: addDays(cursor, -7), ArrowDown: addDays(cursor, 7), Home: addDays(cursor, -dow), End: addDays(cursor, 6 - dow), PageUp: new Date(cursor.getFullYear(), cursor.getMonth() - 1, cursor.getDate()), PageDown: new Date(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate()) }[e.key];
        if (!next) return;
        e.preventDefault();
        cursor = clamp2(next);
        draw();
        focusCursor();
      });
      el.addEventListener("focusout", () => setTimeout(() => !el.contains(document.activeElement) && api.close(), 0));
      if (inline) draw();
      if (start || picks.size) write();
    }
  }
  var showTime = (mins) => {
    const h = Math.floor(mins / 60);
    return `${h % 12 || 12}:${pad(mins % 60)} ${h < 12 ? "am" : "pm"}`;
  };
  var toHm = (mins) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
  var fromHm = (s) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(s || "");
    return m && Number(m[1]) < 24 && Number(m[2]) < 60 ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  function parseTime(text) {
    const m = /^\s*(\d{1,2})(?:[:.]?(\d{2}))?\s*(a|p|am|pm)?\s*$/i.exec(text);
    if (!m) return null;
    let h = Number(m[1]);
    const min = Number(m[2] || 0);
    const half = (m[3] || "").toLowerCase()[0];
    if (min > 59 || (half ? h < 1 || h > 12 : h > 23)) return null;
    if (half === "p" && h < 12) h += 12;
    if (half === "a" && h === 12) h = 0;
    return h * 60 + min;
  }
  function initTimepickers(root2) {
    var _a, _b;
    for (const el of $$("[data-xz-timepicker]", root2)) {
      if (ready(el)) continue;
      const input = el.querySelector('input:not([type="hidden"])');
      const trigger = el.querySelector("button");
      const hidden = el.querySelector('input[type="hidden"]');
      if (!input) continue;
      const step = Math.max(1, Number(el.dataset.xzStep) || 30);
      const min = (_a = fromHm(el.dataset.xzMin)) != null ? _a : 0;
      const max = (_b = fromHm(el.dataset.xzMax)) != null ? _b : 23 * 60 + 59;
      const times = [];
      for (let t = min; t <= max; t += step) times.push(t);
      let value = fromHm(hidden == null ? void 0 : hidden.value);
      let active = -1;
      const list = document.createElement("ul");
      list.className = "xz-picker xz-timelist";
      list.id = `xz-time-${++uid}`;
      list.hidden = true;
      list.setAttribute("role", "listbox");
      list.setAttribute("aria-label", "Times");
      list.innerHTML = times.map((t, i) => `<li class="xz-timelist__option" role="option" id="${list.id}-${i}" data-index="${i}">${showTime(t)}</li>`).join("");
      el.append(list);
      input.setAttribute("role", "combobox");
      input.setAttribute("aria-controls", list.id);
      input.setAttribute("aria-expanded", "false");
      input.setAttribute("aria-autocomplete", "none");
      input.setAttribute("autocomplete", "off");
      const mark2 = () => {
        for (const [i, li] of [...list.children].entries()) {
          li.classList.toggle("is-active", i === active);
          li.setAttribute("aria-selected", String(times[i] === value));
        }
        if (active >= 0) {
          input.setAttribute("aria-activedescendant", `${list.id}-${active}`);
          const li = list.children[active];
          if (li.offsetTop < list.scrollTop) list.scrollTop = li.offsetTop;
          else if (li.offsetTop + li.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = li.offsetTop + li.offsetHeight - list.clientHeight;
        } else input.removeAttribute("aria-activedescendant");
      };
      const write = () => {
        input.value = value === null ? "" : showTime(value);
        if (hidden) hidden.value = value === null ? "" : toHm(value);
        input.removeAttribute("aria-invalid");
        fire(el, "xz:time", { value: value === null ? "" : toHm(value) });
      };
      const api = {
        el,
        close() {
          if (list.hidden) return;
          list.hidden = true;
          input.setAttribute("aria-expanded", "false");
          active = -1;
          mark2();
          if (openPanel === api) openPanel = null;
        }
      };
      const open = () => {
        openPanel == null ? void 0 : openPanel.close();
        list.hidden = false;
        place(list, input.closest(".xz-input-group") || input);
        input.setAttribute("aria-expanded", "true");
        openPanel = api;
        active = value === null ? 0 : Math.max(0, times.findIndex((t) => t >= value));
        mark2();
      };
      const choose = (i) => {
        value = times[i];
        write();
        api.close();
        input.focus();
      };
      trigger == null ? void 0 : trigger.addEventListener("click", () => {
        if (list.hidden) open();
        else api.close();
        input.focus();
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          if (list.hidden) return open();
          active = Math.min(times.length - 1, Math.max(0, active + (e.key === "ArrowDown" ? 1 : -1)));
          mark2();
        } else if (e.key === "Enter" && !list.hidden && active >= 0) {
          e.preventDefault();
          choose(active);
        } else if (e.key === "Escape" && !list.hidden) {
          e.stopPropagation();
          api.close();
        }
      });
      input.addEventListener("change", () => {
        const text = input.value.trim();
        if (!text) {
          value = null;
          return write();
        }
        const t = parseTime(text);
        if (t === null || t < min || t > max) return input.setAttribute("aria-invalid", "true");
        value = t;
        write();
      });
      list.addEventListener("pointerdown", (e) => e.preventDefault());
      list.addEventListener("click", (e) => {
        const li = e.target.closest("[data-index]");
        if (li) choose(Number(li.dataset.index));
      });
      el.addEventListener("focusout", () => setTimeout(() => !el.contains(document.activeElement) && api.close(), 0));
      if (value !== null) write();
    }
  }
  var ALLOWED = /* @__PURE__ */ new Set(["B", "STRONG", "I", "EM", "U", "P", "BR", "UL", "OL", "LI", "H3", "A", "BLOCKQUOTE", "PRE", "CODE"]);
  var SAFE_LINK = /^(https?:|mailto:)/i;
  function sanitize(html) {
    const tpl = document.createElement("template");
    tpl.innerHTML = html;
    const walk = (node) => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === 8) child.remove();
        if (child.nodeType !== 1) continue;
        if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED"].includes(child.tagName)) {
          child.remove();
          continue;
        }
        walk(child);
        if (child.tagName === "DIV") {
          const p = document.createElement("p");
          p.append(...child.childNodes);
          child.replaceWith(p);
        } else if (!ALLOWED.has(child.tagName)) child.replaceWith(...child.childNodes);
        else {
          const href = child.tagName === "A" ? child.getAttribute("href") || "" : "";
          for (const attr of [...child.attributes]) child.removeAttribute(attr.name);
          if (child.tagName === "A") {
            if (SAFE_LINK.test(href)) {
              child.setAttribute("href", href);
              child.setAttribute("rel", "noopener noreferrer");
            } else child.replaceWith(...child.childNodes);
          }
        }
      }
    };
    walk(tpl.content);
    return tpl.innerHTML.trim();
  }
  function initEditors(root2) {
    for (const el of $$("[data-xz-editor]", root2)) {
      if (ready(el)) continue;
      const content = el.querySelector(".xz-editor__content");
      const field = el.querySelector("textarea");
      const counter = el.querySelector("[data-xz-editor-count]");
      if (!content) continue;
      if ((field == null ? void 0 : field.value.trim()) && !content.innerHTML.trim()) content.innerHTML = sanitize(field.value);
      const buttons = $$("[data-xz-cmd]", el);
      const exec = (cmd, arg) => document.execCommand(cmd, false, arg);
      const block = () => String(document.queryCommandValue("formatBlock") || "").toLowerCase().replace(/[<>]/g, "");
      const inside = () => {
        const sel = document.getSelection();
        return sel && sel.rangeCount && content.contains(sel.anchorNode);
      };
      const state = () => {
        for (const btn of buttons) {
          const cmd = btn.dataset.xzCmd;
          if (cmd === "h3" || cmd === "quote" || cmd === "code") btn.setAttribute("aria-pressed", String(inside() && block() === { h3: "h3", quote: "blockquote", code: "pre" }[cmd]));
          else if (["bold", "italic", "underline", "insertUnorderedList", "insertOrderedList"].includes(cmd)) btn.setAttribute("aria-pressed", String(inside() && document.queryCommandState(cmd)));
        }
      };
      const sync = () => {
        const empty = !content.textContent.trim() && !content.querySelector("li");
        if (field) field.value = empty ? "" : sanitize(content.innerHTML);
        if (counter) counter.textContent = `${content.textContent.trim().length} characters`;
        fire(el, "xz:editor", { html: field ? field.value : sanitize(content.innerHTML) });
      };
      el.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-xz-cmd]");
        if (!btn) return;
        const cmd = btn.dataset.xzCmd;
        content.focus();
        if (cmd === "link") {
          const url = window.prompt("Link address", "https://");
          if (url && SAFE_LINK.test(url.trim())) exec("createLink", url.trim());
        } else if (cmd === "h3" || cmd === "quote" || cmd === "code") {
          const tag = { h3: "h3", quote: "blockquote", code: "pre" }[cmd];
          exec("formatBlock", block() === tag ? "p" : tag);
        } else exec(cmd);
        sync();
        state();
      });
      content.addEventListener("focus", () => exec("defaultParagraphSeparator", "p"));
      content.addEventListener("input", sync);
      content.addEventListener("blur", () => {
        if (!content.textContent.trim() && !content.querySelector("li")) content.innerHTML = "";
        sync();
      });
      content.addEventListener("paste", (e) => {
        e.preventDefault();
        exec("insertText", e.clipboardData.getData("text/plain"));
      });
      for (const type of ["keyup", "mouseup", "focus"]) content.addEventListener(type, state);
      sync();
      state();
    }
  }
  function initAdvancedForms(root2, { icon: icon4 }) {
    bindGlobal();
    initSliders(root2);
    initSteppers(root2);
    initOtps(root2);
    initTagInputs(root2, icon4);
    initDropzones(root2, icon4);
    initDatepickers(root2, icon4);
    initTimepickers(root2);
    initEditors(root2);
  }

  // src/js/shared.js
  var $$2 = (sel, root2 = document) => Array.from(root2.querySelectorAll(sel));
  var ready2 = (el, key) => {
    const k = `xz${key}Ready`;
    if (el.dataset[k]) return true;
    el.dataset[k] = "1";
    return false;
  };
  var fire2 = (el, type, detail, cancelable = false) => el.dispatchEvent(new CustomEvent(type, { bubbles: true, cancelable, detail }));
  var esc2 = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  var uid2 = 0;
  var nextId = (p) => `xz-${p}-s${++uid2}`;
  var query = (q) => typeof matchMedia === "function" ? matchMedia(q) : { matches: false, addEventListener() {
  } };
  var reducedQuery = query("(prefers-reduced-motion: reduce)");
  var fineQuery = query("(pointer: fine)");
  var motionOn = () => !reducedQuery.matches && document.documentElement.getAttribute("data-xz-motion") !== "off";
  var finePointer = () => fineQuery.matches;
  var motionListeners = /* @__PURE__ */ new Set();
  var onMotion = (cb) => motionListeners.add(cb);
  var notifyMotion = () => {
    const on = motionOn();
    motionListeners.forEach((cb) => cb(on));
  };
  reducedQuery.addEventListener("change", notifyMotion);
  function watch(el, cb, options = {}) {
    if (typeof IntersectionObserver !== "function") {
      cb(true);
      return null;
    }
    const io2 = new IntersectionObserver((entries) => entries.forEach((e) => cb(e.isIntersecting, e)), options);
    io2.observe(el);
    return io2;
  }
  function perFrame(fn) {
    let frame = 0;
    return () => {
      if (!frame) frame = requestAnimationFrame(() => (frame = 0, fn()));
    };
  }
  var store = {
    get(key, fallback = null) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : JSON.parse(v);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch {
      }
    }
  };
  var isRtl = (el = document.documentElement) => getComputedStyle(el).direction === "rtl";
  function dirKey(e, el) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return null;
    const forward = e.key === "ArrowRight";
    return forward !== isRtl(el) ? "next" : "prev";
  }
  var composing = (e) => e.isComposing || e.keyCode === 229;
  var typing = (t) => Boolean(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)));
  function parseShortcut(s) {
    if (!s || s === "none") return null;
    const parts = String(s).toLowerCase().split("+").map((p) => p.trim()).filter(Boolean);
    const key = parts.pop();
    const has = (m) => parts.includes(m);
    return { key, mod: has("mod"), ctrl: has("ctrl"), meta: has("meta") || has("cmd"), alt: has("alt"), shift: has("shift") };
  }
  function matchShortcut(e, sc) {
    if (!sc || !e.key || e.key.toLowerCase() !== sc.key) return false;
    if (e.altKey !== sc.alt || e.shiftKey !== sc.shift) return false;
    if (sc.mod) return e.ctrlKey !== e.metaKey;
    return e.ctrlKey === sc.ctrl && e.metaKey === sc.meta;
  }
  function ariaShortcut(s) {
    const sc = typeof s === "string" ? parseShortcut(s) : s;
    if (!sc) return "";
    const key = sc.key.length === 1 ? sc.key.toUpperCase() : sc.key[0].toUpperCase() + sc.key.slice(1);
    const extra2 = [sc.alt && "Alt", sc.shift && "Shift"].filter(Boolean);
    const join = (m) => [...m, ...extra2, key].join("+");
    if (sc.mod) return `${join(["Control"])} ${join(["Meta"])}`;
    return join([sc.ctrl && "Control", sc.meta && "Meta"].filter(Boolean));
  }

  // src/js/floating.js
  var current = null;
  function openFloating(entry) {
    if (current && current.panel !== entry.panel) current.close(false);
    current = entry;
  }
  function releaseFloating(panel) {
    if ((current == null ? void 0 : current.panel) === panel) current = null;
  }
  function closeAll() {
    current == null ? void 0 : current.close(false);
    current = null;
  }
  var bound = false;
  function bindGlobal2() {
    if (bound) return;
    bound = true;
    document.addEventListener("pointerdown", (e) => {
      var _a;
      if (current && !current.panel.contains(e.target) && !((_a = current.trigger) == null ? void 0 : _a.contains(e.target))) current.close(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && current) {
        e.preventDefault();
        current.close(true);
      }
    });
    const moved = (e) => {
      if (!current || e && e.target !== document && current.panel.contains(e.target)) return;
      if (current.follow) current.follow();
      else current.close(false);
    };
    addEventListener("resize", () => moved());
    document.addEventListener("scroll", moved, true);
  }
  function floating({ wrapper, trigger, panel, position, focusPanel }) {
    panel.id || (panel.id = nextId("panel"));
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", panel.id);
    const close = (refocus) => {
      if (panel.hidden) return;
      panel.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      wrapper.classList.remove("is-open");
      releaseFloating(panel);
      if (refocus) trigger.focus();
      fire2(wrapper, "xz:close");
    };
    const open = () => {
      openFloating({ panel, trigger, close });
      panel.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      wrapper.classList.add("is-open");
      position();
      if (focusPanel) (panel.querySelector("[autofocus]") || panel).focus({ preventScroll: true });
      fire2(wrapper, "xz:open");
    };
    trigger.addEventListener("click", () => panel.hidden ? open() : close(false));
    panel.addEventListener("focusout", (e) => {
      if (e.relatedTarget && !panel.contains(e.relatedTarget) && e.relatedTarget !== trigger) close(false);
    });
    panel.addEventListener("click", (e) => {
      if (e.target.closest("[data-xz-popover-close]")) close(true);
    });
    wrapper.xzPopover = { open, close };
    return { open, close };
  }

  // src/js/listbox.js
  var normalize = (s) => String(s != null ? s : "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
  var termsOf = (query2) => normalize(query2).split(/\s+/).filter(Boolean);
  var splitWords = (s) => s.split(/[\s\-_/.,:;()[\]|]+/).filter(Boolean);
  function rank(item, terms) {
    if (!terms.length) return 1;
    const label = normalize(item.label);
    const words = splitWords(label);
    const initials = words.map((w) => w[0]).join("");
    const extra2 = normalize([item.keywords, item.meta, item.group].filter(Boolean).join(" "));
    const extraWords = splitWords(extra2);
    let score = 0;
    let last = -1;
    let inOrder = true;
    for (const t of terms) {
      let s;
      if (label === t) s = 100;
      else if (label.startsWith(t)) s = 80;
      else if (words.some((w) => w.startsWith(t))) s = 60;
      else if (t.length > 1 && initials.startsWith(t)) s = 50;
      else if (label.includes(t)) s = 30;
      else if (extraWords.some((w) => w.startsWith(t))) s = 25;
      else if (extra2.includes(t)) s = 10;
      else return 0;
      const at = label.indexOf(t);
      if (at >= 0) {
        if (at < last) inOrder = false;
        last = at;
      }
      score += s;
    }
    if (terms.length > 1) {
      if (inOrder) score += 10;
      if (label === terms.join(" ")) score += 50;
    }
    return score;
  }
  function ranked(items, terms, { boost } = {}) {
    const out = [];
    items.forEach((item, i) => {
      const base = rank(item, terms);
      if (base > 0) out.push({ item, i, score: base + (boost ? boost(item) : 0) });
    });
    return out.sort((a, b) => b.score - a.score || a.item.label.length - b.item.label.length || a.i - b.i).map((r) => r.item);
  }
  function highlight(label, terms) {
    const text = String(label);
    const lower = text.toLowerCase();
    const ranges = [];
    for (const t of terms) {
      const i = lower.indexOf(t);
      if (i >= 0) ranges.push([i, i + t.length]);
    }
    if (!ranges.length) return esc2(text);
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [ranges[0]];
    for (const r of ranges.slice(1)) {
      const prev = merged[merged.length - 1];
      if (r[0] <= prev[1]) prev[1] = Math.max(prev[1], r[1]);
      else merged.push(r);
    }
    let html = "";
    let at = 0;
    for (const [s, e] of merged) {
      html += esc2(text.slice(at, s)) + "<mark>" + esc2(text.slice(s, e)) + "</mark>";
      at = e;
    }
    return html + esc2(text.slice(at));
  }
  function recentList(key, { max = 5, same = (a, b) => a === b } = {}) {
    return {
      get: () => (key ? store.get(key, []) : []).slice(0, max),
      add(value) {
        if (!key || !value) return;
        const list = [value, ...store.get(key, []).filter((v) => !same(v, value))].slice(0, max);
        store.set(key, list);
      },
      clear: () => key && store.remove(key)
    };
  }
  async function fetchItems(url, q, signal) {
    const res = await fetch(url.includes("{q}") ? url.replace("{q}", encodeURIComponent(q)) : url + encodeURIComponent(q), { signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    return (Array.isArray(data) ? data : []).map((d) => {
      var _a;
      return { label: String((_a = d.label) != null ? _a : ""), group: d.group || "", href: d.href || "", meta: d.meta || "", icon: d.icon || "", keywords: d.keywords || "" };
    });
  }
  function keepInView(list, el) {
    if (!el) return;
    const top = el.offsetTop;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (top + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = top + el.offsetHeight - list.clientHeight;
  }

  // src/js/components.js
  var $$3 = (sel, root2 = document) => Array.from(root2.querySelectorAll(sel));
  var ready3 = (el) => {
    if (el.dataset.xzReady) return true;
    el.dataset.xzReady = "1";
    return false;
  };
  var fire3 = (el, type, detail, cancelable = false) => el.dispatchEvent(new CustomEvent(type, { bubbles: true, cancelable, detail }));
  var esc3 = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  var uid3 = 0;
  var nextId2 = (p) => `xz-${p}-c${++uid3}`;
  var icon = () => "";
  var validateField = () => true;
  function initPopovers(root2) {
    for (const pop of $$3("[data-xz-popover]", root2)) {
      if (ready3(pop)) continue;
      const trigger = pop.querySelector(":scope > button, :scope > [data-xz-popover-trigger]");
      const panel = pop.querySelector(":scope > .xz-popover__panel");
      if (!trigger || !panel) continue;
      panel.tabIndex = -1;
      if (!panel.hasAttribute("role")) panel.setAttribute("role", "dialog");
      const title = panel.querySelector(".xz-popover__title");
      if (title) {
        title.id || (title.id = nextId2("popover-title"));
        panel.setAttribute("aria-labelledby", title.id);
      } else if (!panel.hasAttribute("aria-label")) {
        panel.setAttribute("aria-label", trigger.getAttribute("aria-label") || trigger.textContent.trim());
      }
      const align = pop.getAttribute("data-xz-popover") === "end" ? "end" : "start";
      floating({ wrapper: pop, trigger, panel, focusPanel: true, position: () => place(panel, trigger, { align, gap: 6 }) });
    }
  }
  function initNotifications(root2) {
    for (const box2 of $$3("[data-xz-notifications]", root2)) {
      if (box2.dataset.xzNotifyReady) continue;
      box2.dataset.xzNotifyReady = "1";
      const trigger = box2.querySelector(":scope > button");
      const list = box2.querySelector(".xz-notifications__list");
      if (!trigger || !list) continue;
      const label = trigger.getAttribute("aria-label") || "Notifications";
      let count = box2.querySelector(".xz-notify-count");
      if (!count) {
        count = Object.assign(document.createElement("span"), { className: "xz-notify-count" });
        count.setAttribute("aria-hidden", "true");
        trigger.append(count);
      }
      const markAll = box2.querySelector("[data-xz-mark-all]");
      const sync = () => {
        var _a;
        const items = $$3(".xz-notification", list);
        const unread = items.filter((n) => n.classList.contains("is-unread"));
        for (const n of items) {
          let flag = n.querySelector(":scope .xz-notification__flag");
          if (n.classList.contains("is-unread") && !flag) {
            flag = Object.assign(document.createElement("span"), { className: "xz-sr-only xz-notification__flag", textContent: "Unread. " });
            (n.querySelector(".xz-notification__body") || n).prepend(flag);
          } else if (!n.classList.contains("is-unread") && flag) flag.remove();
        }
        count.textContent = unread.length > 9 ? "9+" : String(unread.length);
        count.hidden = unread.length === 0;
        trigger.setAttribute("aria-label", unread.length ? `${label}, ${unread.length} unread` : label);
        if (markAll) markAll.disabled = unread.length === 0;
        (_a = box2.querySelector(".xz-notifications__empty")) == null ? void 0 : _a.toggleAttribute("hidden", items.length > 0);
      };
      const read = (items) => {
        const changed2 = items.filter((n) => n.classList.contains("is-unread"));
        if (!changed2.length) return;
        changed2.forEach((n) => n.classList.remove("is-unread"));
        sync();
        fire3(box2, "xz:read", { items: changed2 });
      };
      list.addEventListener("click", (e) => {
        const n = e.target.closest(".xz-notification");
        if (n) read([n]);
      });
      markAll == null ? void 0 : markAll.addEventListener("click", () => read($$3(".xz-notification", list)));
      box2.xzNotifications = { sync, read };
      sync();
    }
  }
  function initMegaMenus(root2) {
    for (const menu of $$3("[data-xz-megamenu]", root2)) {
      if (ready3(menu)) continue;
      const trigger = menu.querySelector(":scope > button");
      const panel = menu.querySelector(":scope > .xz-megamenu__panel");
      if (!trigger || !panel) continue;
      floating({
        wrapper: menu,
        trigger,
        panel,
        focusPanel: false,
        position: () => {
          const bar = trigger.closest(".xz-navbar") || trigger;
          const top = bar.getBoundingClientRect().bottom;
          Object.assign(panel.style, { position: "fixed", top: `${top}px`, left: "0px", right: "0px", maxHeight: `calc(100dvh - ${top}px)` });
        }
      });
    }
  }
  function menuKeys(list, close) {
    list.addEventListener("keydown", (e) => {
      var _a;
      const all = $$3(".xz-menu__item:not(:disabled)", list);
      const i = all.indexOf(document.activeElement);
      if (e.key === "Tab") return close(false);
      const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: all.length - 1 }[e.key];
      if (next === void 0) return;
      e.preventDefault();
      (_a = all[(next + all.length) % all.length]) == null ? void 0 : _a.focus();
    });
  }
  function initContextMenus(root2) {
    for (const target2 of $$3("[data-xz-context-menu]", root2)) {
      if (ready3(target2)) continue;
      const list = document.querySelector(target2.getAttribute("data-xz-context-menu"));
      if (!list) continue;
      if (!list.dataset.xzContextReady) {
        list.dataset.xzContextReady = "1";
        list.hidden = true;
        list.setAttribute("role", "menu");
        list.classList.add("xz-context-menu");
        for (const item of $$3(".xz-menu__item", list)) {
          item.setAttribute("role", "menuitem");
          item.tabIndex = -1;
          if (item.parentElement.tagName === "LI") item.parentElement.setAttribute("role", "none");
        }
        document.body.append(list);
        const close = (refocus) => {
          var _a;
          if (list.hidden) return;
          list.hidden = true;
          releaseFloating(list);
          if (refocus) (_a = list.xzTarget) == null ? void 0 : _a.focus();
        };
        list.xzClose = close;
        menuKeys(list, close);
        list.addEventListener("click", (e) => {
          const item = e.target.closest(".xz-menu__item");
          if (!item || item.disabled) return;
          const t = list.xzTarget;
          close(true);
          fire3(t, "xz:action", { action: item.dataset.action || item.textContent.trim(), item });
        });
      }
      if (!target2.hasAttribute("tabindex") && !target2.matches("a, button, input, select, textarea")) target2.tabIndex = 0;
      target2.setAttribute("aria-haspopup", "menu");
      const open = (x, y) => {
        var _a;
        openFloating({ panel: list, trigger: null, close: list.xzClose });
        list.xzTarget = target2;
        list.hidden = false;
        placeAt(list, x, y);
        fire3(target2, "xz:open");
        (_a = list.querySelector(".xz-menu__item:not(:disabled)")) == null ? void 0 : _a.focus({ preventScroll: true });
      };
      target2.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (list.hidden || list.xzTarget !== target2) open(e.clientX, e.clientY);
      });
      target2.addEventListener("keydown", (e) => {
        if (e.target !== target2) return;
        if (e.key === "ContextMenu" || e.key === "F10" && e.shiftKey) {
          e.preventDefault();
          const r = target2.getBoundingClientRect();
          open(r.left + 8, r.top + Math.min(r.height, 32));
        }
      });
      let timer;
      let start;
      target2.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "touch") return;
        start = [e.clientX, e.clientY];
        timer = setTimeout(() => open(start[0], start[1]), 550);
      });
      target2.addEventListener("pointermove", (e) => {
        if (timer && start && Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 10) clearTimeout(timer);
      });
      for (const type of ["pointerup", "pointercancel"]) target2.addEventListener(type, () => clearTimeout(timer));
    }
  }
  var recentSearches = (name) => recentList(name ? `xz-search-recent:${name}` : "", { max: 5, same: (a, b) => a.toLowerCase() === b.toLowerCase() });
  var readRecent = (name) => recentSearches(name).get();
  var saveRecent = (name, query2) => name && query2 && recentSearches(name).add(query2);
  var mark = (label, query2) => highlight(label, termsOf(query2));
  function initSearches(root2) {
    for (const box2 of $$3("[data-xz-search]:not(table)", root2)) {
      if (ready3(box2)) continue;
      const input = box2.querySelector('input[type="search"], input[type="text"]');
      if (!input) continue;
      const group = input.closest(".xz-input-group") || input;
      const recentName = box2.getAttribute("data-xz-recent");
      const url = box2.getAttribute("data-xz-search-url");
      const max = Number(box2.getAttribute("data-xz-max") || 8);
      const source2 = $$3(".xz-search__source > li", box2).map((li) => ({ label: li.textContent.trim(), group: li.dataset.group || "", href: li.dataset.href || "", meta: li.dataset.meta || "", keywords: li.dataset.keywords || "" }));
      const list = Object.assign(document.createElement("ul"), { className: "xz-search__list", id: nextId2("search") });
      list.setAttribute("role", "listbox");
      list.setAttribute("aria-label", "Suggestions");
      list.hidden = true;
      box2.append(list);
      const status = Object.assign(document.createElement("div"), { className: "xz-sr-only" });
      status.setAttribute("aria-live", "polite");
      box2.append(status);
      input.setAttribute("role", "combobox");
      input.setAttribute("aria-autocomplete", "list");
      input.setAttribute("aria-expanded", "false");
      input.setAttribute("aria-controls", list.id);
      input.autocomplete = "off";
      let options = [];
      let active = -1;
      let pending;
      let timer;
      const setActive = (i) => {
        active = i;
        $$3('[role="option"]', list).forEach((el2, n) => el2.classList.toggle("is-active", n === i));
        const el = list.querySelectorAll('[role="option"]')[i];
        if (el) {
          input.setAttribute("aria-activedescendant", el.id);
          if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;
          else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
        } else input.removeAttribute("aria-activedescendant");
      };
      const close = () => {
        if (list.hidden) return;
        list.hidden = true;
        input.setAttribute("aria-expanded", "false");
        input.removeAttribute("aria-activedescendant");
        active = -1;
        releaseFloating(list);
      };
      const show2 = () => {
        openFloating({ panel: list, trigger: group, close, follow: () => place(list, group) });
        list.hidden = false;
        input.setAttribute("aria-expanded", "true");
        list.style.width = `${Math.max(group.getBoundingClientRect().width, 240)}px`;
        place(list, group);
      };
      const row = (cls, html) => `<li role="presentation" class="${cls}">${html}</li>`;
      const render = (items, query2, note) => {
        options = items;
        let html = "";
        let last = null;
        items.forEach((o, i) => {
          if (o.group !== last) {
            last = o.group;
            if (o.group) html += row("xz-search__group", esc3(o.group));
          }
          const lead = o.kind === "recent" ? icon("history", { size: "sm" }) : o.kind === "query" ? icon("search", { size: "sm" }) : "";
          html += `<li role="option" id="${list.id}-${i}" class="xz-search__option" data-index="${i}">${lead}<span class="xz-search__label">${o.kind === "query" ? `Search for \u201C${esc3(query2)}\u201D` : mark(o.label, query2)}</span>${o.meta ? `<span class="xz-search__meta">${esc3(o.meta)}</span>` : ""}</li>`;
        });
        if (note) html += row("xz-search__note", esc3(note));
        list.innerHTML = html;
        active = -1;
        if (!html) return close();
        show2();
        const n = items.filter((o) => o.kind !== "query").length;
        status.textContent = query2 ? n ? `${n} suggestion${n === 1 ? "" : "s"}` : "No suggestions" : "";
      };
      const groupOrder = [...new Set(source2.map((o) => o.group))];
      const local = (q) => {
        const best = ranked(source2, termsOf(q));
        return groupOrder.flatMap((g) => best.filter((o) => o.group === g)).slice(0, max);
      };
      const update2 = () => {
        const q = input.value.trim();
        clearTimeout(timer);
        pending == null ? void 0 : pending.abort();
        if (!q) {
          const recent = recentName ? readRecent(recentName).map((label) => ({ label, group: "Recent searches", kind: "recent" })) : [];
          return recent.length ? render(recent, "") : close();
        }
        const withQuery = (items) => [...items, { label: q, group: "", kind: "query" }];
        if (!url) return render(withQuery(local(q)), q);
        render(withQuery(local(q)), q, "Searching\u2026");
        timer = setTimeout(async () => {
          pending = new AbortController();
          try {
            const data = await fetchItems(url, q, pending.signal);
            if (input.value.trim() !== q) return;
            render(withQuery([...local(q), ...data].slice(0, max)), q);
          } catch (err) {
            if (err.name !== "AbortError") render(withQuery(local(q)), q, "Could not load more suggestions.");
          }
        }, 200);
      };
      const submit = (query2) => {
        input.value = query2;
        saveRecent(recentName, query2);
        close();
        const form = box2.tagName === "FORM" ? box2 : null;
        if (form) form.requestSubmit ? form.requestSubmit() : form.submit();
        else fire3(box2, "xz:search", { query: query2 }, true);
      };
      const choose = (o) => {
        if (!o) return;
        if (o.kind === "recent" || o.kind === "query") return submit(o.kind === "query" ? input.value.trim() : o.label);
        saveRecent(recentName, o.label);
        close();
        if (!fire3(box2, "xz:select", { item: o }, true)) return;
        if (o.href) location.href = o.href;
        else submit(o.label);
      };
      input.addEventListener("input", update2);
      input.addEventListener("focus", () => !input.value.trim() && update2());
      input.addEventListener("keydown", (e) => {
        const count = options.length;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          if (list.hidden) return update2();
          if (!count) return;
          setActive(e.key === "ArrowDown" ? (active + 1) % count : (active - 1 + count) % count);
        } else if (e.key === "Enter") {
          if (!list.hidden && active >= 0) {
            e.preventDefault();
            choose(options[active]);
          } else if (box2.tagName !== "FORM") {
            e.preventDefault();
            submit(input.value.trim());
          }
        } else if (e.key === "Escape") {
          if (!list.hidden) {
            e.preventDefault();
            e.stopPropagation();
            close();
          } else if (input.value) {
            e.preventDefault();
            input.value = "";
          }
        }
      });
      list.addEventListener("pointerdown", (e) => e.preventDefault());
      list.addEventListener("click", (e) => {
        const el = e.target.closest('[role="option"]');
        if (el) choose(options[Number(el.dataset.index)]);
      });
      input.addEventListener("blur", () => setTimeout(() => document.activeElement !== input && close(), 0));
      if (box2.tagName === "FORM") {
        box2.addEventListener("submit", (e) => {
          const query2 = input.value.trim();
          saveRecent(recentName, query2);
          close();
          if (!fire3(box2, "xz:search", { query: query2 }, true)) e.preventDefault();
        });
      }
      const key = box2.getAttribute("data-xz-shortcut");
      if (key) {
        const combo = key.length > 1 && key.includes("+") ? parseShortcut(key) : null;
        document.addEventListener("keydown", (e) => {
          if (combo ? !matchShortcut(e, combo) : e.key !== key || e.ctrlKey || e.metaKey || e.altKey) return;
          if (typing(e.target) && !combo) return;
          e.preventDefault();
          input.focus();
        });
      }
    }
  }
  function initSheets(root2) {
    for (const sheet of $$3("dialog.xz-sheet", root2)) {
      if (ready3(sheet)) continue;
      const grip = sheet.querySelector(".xz-sheet__handle");
      const zones = [grip, sheet.querySelector(".xz-sheet__header")].filter(Boolean);
      let startY = null;
      let startT = 0;
      let dy = 0;
      let dragged = false;
      const settle = () => {
        sheet.style.transform = "";
        sheet.style.transition = "";
        sheet.classList.remove("is-dragging");
      };
      sheet.addEventListener("close", settle);
      for (const zone of zones) {
        zone.addEventListener("pointerdown", (e) => {
          const control = e.target.closest("button, a, input, select, textarea");
          if (e.button !== 0 || control && control !== grip) return;
          startY = e.clientY;
          startT = performance.now();
          dy = 0;
          dragged = false;
          try {
            zone.setPointerCapture(e.pointerId);
          } catch {
          }
          sheet.classList.add("is-dragging");
        });
        zone.addEventListener("pointermove", (e) => {
          if (startY === null) return;
          dy = Math.max(0, e.clientY - startY);
          if (dy > 4) dragged = true;
          sheet.style.transform = `translateY(${dy}px)`;
        });
        const end = () => {
          if (startY === null) return;
          startY = null;
          const fast = dy / Math.max(1, performance.now() - startT) > 0.5;
          if (dy > Math.min(120, sheet.offsetHeight * 0.25) || fast && dy > 24) {
            sheet.style.transition = reduced() ? "none" : "transform var(--xz-duration-base) var(--xz-ease-in)";
            sheet.style.transform = "translateY(100%)";
            setTimeout(() => sheet.close(), reduced() ? 0 : 200);
          } else {
            sheet.style.transition = "transform var(--xz-duration-base) var(--xz-ease-out)";
            sheet.style.transform = "";
            setTimeout(settle, 200);
          }
        };
        zone.addEventListener("pointerup", end);
        zone.addEventListener("pointercancel", end);
      }
      if (grip && grip.tagName === "BUTTON") grip.addEventListener("click", () => dragged ? dragged = false : sheet.close());
    }
  }
  function initWizards(root2) {
    for (const form of $$3("[data-xz-wizard]", root2)) {
      if (ready3(form)) continue;
      const panels = $$3(".xz-wizard__panel", form);
      const stepItems = $$3(".xz-wizard__steps > li", form);
      if (!panels.length) continue;
      if (form.tagName === "FORM") form.noValidate = true;
      const back = form.querySelector("[data-xz-wizard-back]");
      const next = form.querySelector("[data-xz-wizard-next]");
      const done = form.querySelector("[data-xz-wizard-submit]");
      const count = form.querySelector(".xz-wizard__count");
      let at = 0;
      let furthest = 0;
      const stepButtons = stepItems.map((li, i) => {
        const btn = Object.assign(document.createElement("button"), { type: "button", className: "xz-wizard__step-btn" });
        btn.innerHTML = `<span class="xz-wizard__marker" aria-hidden="true">${i + 1}</span><span class="xz-wizard__label">${li.innerHTML}</span>`;
        li.replaceChildren(btn);
        btn.addEventListener("click", () => go(i));
        return btn;
      });
      const fields = (panel) => $$3("input, select, textarea", panel).filter((f) => f.willValidate);
      const check = (panel) => {
        const bad = fields(panel).filter((f) => !validateField(f));
        if (bad[0]) (bad[0].hidden ? panel.querySelector('[role="combobox"]') || bad[0] : bad[0]).focus();
        return !bad.length;
      };
      const show2 = (i, focus = true) => {
        const from = at;
        at = i;
        furthest = Math.max(furthest, i);
        panels.forEach((p, n) => p.hidden = n !== i);
        stepItems.forEach((li, n) => {
          const isDone = n !== i && n < furthest;
          li.classList.toggle("is-done", isDone);
          li.classList.toggle("is-current", n === i);
          const b = stepButtons[n];
          if (n === i) b.setAttribute("aria-current", "step");
          else b.removeAttribute("aria-current");
          b.disabled = n > furthest;
          const state = n === i ? "current step" : isDone ? "done" : n <= furthest ? "visited" : "not started";
          b.setAttribute("aria-label", `Step ${n + 1}: ${b.querySelector(".xz-wizard__label").textContent.trim()}, ${state}`);
        });
        if (back) back.hidden = i === 0;
        if (next) next.hidden = i === panels.length - 1;
        if (done) done.hidden = i !== panels.length - 1;
        if (count) count.textContent = `Step ${i + 1} of ${panels.length}`;
        form.style.setProperty("--xz-wizard-progress", `${i / Math.max(1, panels.length - 1) * 100}%`);
        if (focus) {
          const title = panels[i].querySelector(".xz-wizard__title, legend, h2, h3") || panels[i];
          title.tabIndex = -1;
          title.focus({ preventScroll: false });
        }
        if (from !== i) fire3(form, "xz:step", { step: i, from });
      };
      const go = (i) => {
        if (i === at || i < 0 || i >= panels.length) return;
        if (i > at) {
          for (let n = at; n < i; n++) if (!check(panels[n])) return show2(n, false);
        }
        show2(i);
      };
      back == null ? void 0 : back.addEventListener("click", () => go(at - 1));
      next == null ? void 0 : next.addEventListener("click", () => go(at + 1));
      form.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" || at === panels.length - 1) return;
        const t = e.target;
        if (t.tagName === "TEXTAREA" || t.tagName === "BUTTON" || t.getAttribute("role") === "combobox" || t.isContentEditable) return;
        if (t.tagName === "INPUT") {
          e.preventDefault();
          go(at + 1);
        }
      });
      form.addEventListener("submit", (e) => {
        for (let n = 0; n < panels.length; n++) {
          if (!fields(panels[n]).every((f) => f.checkValidity())) {
            e.preventDefault();
            e.stopImmediatePropagation();
            show2(n, false);
            check(panels[n]);
            return;
          }
        }
      }, true);
      form.xzWizard = { go, get step() {
        return at;
      } };
      show2(0, false);
    }
  }
  function initCarousels(root2) {
    for (const car of $$3("[data-xz-carousel]", root2)) {
      if (ready3(car)) continue;
      const track = car.querySelector(".xz-carousel__track");
      if (!track) continue;
      const slides = Array.from(track.children);
      car.setAttribute("aria-roledescription", "carousel");
      track.tabIndex = 0;
      track.setAttribute("aria-label", "Slides. Use the arrow keys to scroll.");
      slides.forEach((s, i) => {
        s.setAttribute("role", "group");
        s.setAttribute("aria-roledescription", "slide");
        s.setAttribute("aria-label", `${i + 1} of ${slides.length}`);
      });
      const controls = Object.assign(document.createElement("div"), { className: "xz-carousel__controls" });
      controls.innerHTML = `<button type="button" class="xz-btn xz-btn--icon xz-btn--sm xz-carousel__prev" aria-label="Previous slide">${icon("chevron-left", { size: "sm" })}</button><div class="xz-carousel__dots">${slides.map((_, i) => `<button type="button" class="xz-carousel__dot" aria-label="Go to slide ${i + 1}"></button>`).join("")}</div><button type="button" class="xz-btn xz-btn--icon xz-btn--sm xz-carousel__next" aria-label="Next slide">${icon("chevron-right", { size: "sm" })}</button>`;
      car.append(controls);
      const prev = controls.querySelector(".xz-carousel__prev");
      const nextBtn = controls.querySelector(".xz-carousel__next");
      const dots = $$3(".xz-carousel__dot", controls);
      const step = () => slides[1] ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth;
      const index = () => Math.round(track.scrollLeft / Math.max(1, step()));
      const to = (i) => track.scrollTo({ left: slides[Math.max(0, Math.min(i, slides.length - 1))].offsetLeft - slides[0].offsetLeft, behavior: reduced() ? "auto" : "smooth" });
      const sync = () => {
        const max = track.scrollWidth - track.clientWidth;
        controls.hidden = max <= 1;
        prev.disabled = track.scrollLeft <= 1;
        nextBtn.disabled = track.scrollLeft >= max - 1;
        const at = track.scrollLeft >= max - 1 ? slides.length - 1 : index();
        dots.forEach((d, i) => i === at ? d.setAttribute("aria-current", "true") : d.removeAttribute("aria-current"));
      };
      prev.addEventListener("click", () => to(index() - 1));
      nextBtn.addEventListener("click", () => to(index() + 1));
      dots.forEach((d, i) => d.addEventListener("click", () => to(i)));
      let raf;
      track.addEventListener("scroll", () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(sync);
      });
      new ResizeObserver(sync).observe(track);
      car.xzCarousel = { to, get index() {
        return index();
      } };
      sync();
    }
  }
  var box;
  function lightbox() {
    if (box) return box;
    const dlg = document.createElement("dialog");
    dlg.className = "xz-lightbox";
    dlg.setAttribute("aria-label", "Image viewer");
    dlg.innerHTML = `<div class="xz-lightbox__bar"><span class="xz-lightbox__count" aria-live="polite"></span><button type="button" class="xz-lightbox__btn" data-xz-close aria-label="Close">${icon("x")}</button></div>
<figure class="xz-lightbox__figure"><img class="xz-lightbox__img" alt=""><figcaption class="xz-lightbox__caption"></figcaption></figure>
<button type="button" class="xz-lightbox__btn xz-lightbox__nav xz-lightbox__nav--prev" aria-label="Previous image">${icon("chevron-left")}</button>
<button type="button" class="xz-lightbox__btn xz-lightbox__nav xz-lightbox__nav--next" aria-label="Next image">${icon("chevron-right")}</button>`;
    document.body.append(dlg);
    const img = dlg.querySelector(".xz-lightbox__img");
    const cap = dlg.querySelector(".xz-lightbox__caption");
    const count = dlg.querySelector(".xz-lightbox__count");
    const prev = dlg.querySelector(".xz-lightbox__nav--prev");
    const next = dlg.querySelector(".xz-lightbox__nav--next");
    let items = [];
    let at = 0;
    const show2 = (i) => {
      at = (i + items.length) % items.length;
      const it = items[at];
      img.src = it.href;
      img.alt = it.alt;
      cap.textContent = it.caption;
      cap.hidden = !it.caption;
      count.textContent = `${at + 1} of ${items.length}`;
      prev.hidden = next.hidden = items.length < 2;
    };
    prev.addEventListener("click", () => show2(at - 1));
    next.addEventListener("click", () => show2(at + 1));
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show2(at - 1);
      if (e.key === "ArrowRight") show2(at + 1);
    });
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg || e.target.classList.contains("xz-lightbox__figure")) dlg.close();
    });
    let sx = null;
    dlg.addEventListener("pointerdown", (e) => sx = e.pointerType === "mouse" ? null : e.clientX);
    dlg.addEventListener("pointerup", (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx;
      sx = null;
      if (Math.abs(dx) > 50) show2(at + (dx < 0 ? 1 : -1));
    });
    let opener = null;
    dlg.addEventListener("close", () => {
      img.removeAttribute("src");
      opener == null ? void 0 : opener.focus();
    });
    box = {
      open(list, i, from) {
        items = list;
        opener = from || null;
        show2(i);
        dlg.showModal();
        next.hidden ? dlg.querySelector("[data-xz-close]").focus() : next.focus();
      }
    };
    return box;
  }
  function initLightboxes(root2) {
    for (const gallery of $$3("[data-xz-lightbox]", root2)) {
      if (ready3(gallery)) continue;
      gallery.addEventListener("click", (e) => {
        const a = e.target.closest("a[href]");
        if (!a || !gallery.contains(a) || e.ctrlKey || e.metaKey || e.shiftKey) return;
        e.preventDefault();
        const links = $$3("a[href]", gallery);
        const items = links.map((l) => {
          var _a;
          return { href: l.href, alt: ((_a = l.querySelector("img")) == null ? void 0 : _a.alt) || "", caption: l.dataset.caption || "" };
        });
        lightbox().open(items, links.indexOf(a), a);
      });
    }
  }
  var clock = (s) => {
    if (!Number.isFinite(s)) return "0:00";
    s = Math.floor(s);
    const h = Math.floor(s / 3600);
    const m = Math.floor(s % 3600 / 60);
    const sec = String(s % 60).padStart(2, "0");
    return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
  };
  var spoken = (s) => {
    s = Math.floor(s || 0);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return [m && `${m} minute${m === 1 ? "" : "s"}`, `${sec} second${sec === 1 ? "" : "s"}`].filter(Boolean).join(" ");
  };
  var SPEEDS = [1, 1.25, 1.5, 2, 0.75];
  function initPlayers(root2) {
    for (const player of $$3("[data-xz-player]", root2)) {
      if (ready3(player)) continue;
      const media = player.querySelector("video, audio");
      if (!media) continue;
      const video = media.tagName === "VIDEO";
      media.controls = false;
      media.removeAttribute("controls");
      player.classList.add("xz-player", video ? "xz-player--video" : "xz-player--audio");
      if (!player.hasAttribute("role")) player.setAttribute("role", "group");
      if (!player.hasAttribute("aria-label")) player.setAttribute("aria-label", player.getAttribute("data-xz-title") || (video ? "Video player" : "Audio player"));
      const track = media.querySelector('track[kind="captions"], track[kind="subtitles"]');
      const bar = Object.assign(document.createElement("div"), { className: "xz-player__bar" });
      bar.innerHTML = `
      <button type="button" class="xz-player__btn" data-act="play" aria-label="Play">${icon("play", { size: "sm" })}</button>
      <span class="xz-player__time"><span data-now>0:00</span><span aria-hidden="true"> / </span><span data-total>0:00</span></span>
      <input class="xz-slider xz-player__seek" type="range" min="0" max="0" step="0.1" value="0" aria-label="Seek">
      <button type="button" class="xz-player__btn" data-act="mute" aria-label="Mute">${icon("volume-2", { size: "sm" })}</button>
      <input class="xz-slider xz-player__volume" type="range" min="0" max="1" step="0.05" value="1" aria-label="Volume">
      <button type="button" class="xz-player__btn xz-player__speed" data-act="speed" aria-label="Playback speed, 1 times">1\xD7</button>
      ${track ? `<button type="button" class="xz-player__btn" data-act="captions" aria-label="Captions" aria-pressed="false">CC</button>` : ""}
      ${video ? `<button type="button" class="xz-player__btn" data-act="full" aria-label="Full screen">${icon("maximize", { size: "sm" })}</button>` : ""}`;
      player.append(bar);
      let big;
      if (video) {
        big = Object.assign(document.createElement("button"), { type: "button", className: "xz-player__big" });
        big.setAttribute("aria-label", "Play");
        big.innerHTML = icon("play");
        player.append(big);
        media.addEventListener("click", () => media.paused ? media.play() : media.pause());
      }
      const q = (s) => bar.querySelector(s);
      const playBtn = q('[data-act="play"]');
      const muteBtn = q('[data-act="mute"]');
      const speedBtn = q('[data-act="speed"]');
      const capBtn = q('[data-act="captions"]');
      const fullBtn = q('[data-act="full"]');
      const seek = q(".xz-player__seek");
      const vol = q(".xz-player__volume");
      const now = q("[data-now]");
      const total = q("[data-total]");
      const fill = (input) => input.style.setProperty("--_fill", `${input.max > 0 ? input.value / input.max * 100 : 0}%`);
      let seeking = false;
      const resumeKey = player.hasAttribute("data-xz-resume") ? `xz-player:${player.getAttribute("data-xz-resume") || media.currentSrc || media.src}` : null;
      let lastSave = 0;
      const syncPlay = () => {
        const paused = media.paused;
        playBtn.innerHTML = icon(paused ? "play" : "pause", { size: "sm" });
        playBtn.setAttribute("aria-label", paused ? "Play" : "Pause");
        player.classList.toggle("is-playing", !paused);
        if (big) big.hidden = !paused;
      };
      const syncTime = () => {
        if (!seeking) seek.value = media.currentTime;
        now.textContent = clock(media.currentTime);
        seek.setAttribute("aria-valuetext", `${spoken(media.currentTime)} of ${spoken(media.duration)}`);
        fill(seek);
        if (resumeKey && Date.now() - lastSave > 4e3) {
          lastSave = Date.now();
          try {
            localStorage.setItem(resumeKey, String(media.ended ? 0 : media.currentTime));
          } catch {
          }
        }
      };
      const syncVolume = () => {
        const muted = media.muted || media.volume === 0;
        muteBtn.innerHTML = icon(muted ? "volume-x" : "volume-2", { size: "sm" });
        muteBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
        vol.value = media.muted ? 0 : media.volume;
        fill(vol);
      };
      let probing = false;
      const meta = () => {
        if (media.duration === Infinity) {
          if (!probing) {
            probing = true;
            media.currentTime = 1e7;
          }
          return;
        }
        if (probing) {
          probing = false;
          media.currentTime = 0;
        }
        seek.max = Number.isFinite(media.duration) ? media.duration : 0;
        total.textContent = clock(media.duration);
        if (resumeKey) {
          try {
            const t = Number(localStorage.getItem(resumeKey));
            if (t > 1 && t < media.duration - 2) media.currentTime = t;
          } catch {
          }
        }
        syncTime();
      };
      const fullscreen = () => {
        var _a;
        if (document.fullscreenElement) return document.exitFullscreen();
        if (player.requestFullscreen) player.requestFullscreen();
        else (_a = media.webkitEnterFullscreen) == null ? void 0 : _a.call(media);
      };
      media.addEventListener("play", syncPlay);
      media.addEventListener("pause", syncPlay);
      media.addEventListener("ended", syncPlay);
      media.addEventListener("timeupdate", syncTime);
      media.addEventListener("loadedmetadata", meta);
      media.addEventListener("durationchange", meta);
      media.addEventListener("volumechange", syncVolume);
      media.addEventListener("waiting", () => player.classList.add("is-loading"));
      for (const t of ["playing", "canplay", "pause"]) media.addEventListener(t, () => player.classList.remove("is-loading"));
      if (media.readyState >= 1) meta();
      seek.addEventListener("input", () => {
        seeking = true;
        now.textContent = clock(seek.value);
        fill(seek);
      });
      seek.addEventListener("change", () => {
        media.currentTime = Number(seek.value);
        seeking = false;
      });
      vol.addEventListener("input", () => {
        media.volume = Number(vol.value);
        media.muted = media.volume === 0;
      });
      bar.addEventListener("click", (e) => {
        var _a;
        const act = (_a = e.target.closest("[data-act]")) == null ? void 0 : _a.dataset.act;
        if (act === "play") media.paused ? media.play() : media.pause();
        if (act === "mute") {
          if (media.muted || media.volume === 0) {
            media.muted = false;
            if (media.volume === 0) media.volume = 0.6;
          } else media.muted = true;
        }
        if (act === "speed") {
          const nextRate = SPEEDS[(SPEEDS.indexOf(media.playbackRate) + 1) % SPEEDS.length] || 1;
          media.playbackRate = nextRate;
          speedBtn.textContent = `${nextRate}\xD7`;
          speedBtn.setAttribute("aria-label", `Playback speed, ${nextRate} times`);
        }
        if (act === "captions" && track) {
          const on = track.track.mode !== "showing";
          track.track.mode = on ? "showing" : "hidden";
          capBtn.setAttribute("aria-pressed", String(on));
        }
        if (act === "full") fullscreen();
      });
      big == null ? void 0 : big.addEventListener("click", () => media.play());
      document.addEventListener("fullscreenchange", () => {
        if (!fullBtn) return;
        const on = document.fullscreenElement === player;
        fullBtn.innerHTML = icon(on ? "minimize" : "maximize", { size: "sm" });
        fullBtn.setAttribute("aria-label", on ? "Exit full screen" : "Full screen");
      });
      player.addEventListener("keydown", (e) => {
        const t = e.target;
        const onButton = t.tagName === "BUTTON";
        const onRange = t.type === "range";
        if ((e.key === " " || e.key === "k") && !onButton) {
          e.preventDefault();
          media.paused ? media.play() : media.pause();
        } else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !onRange) {
          e.preventDefault();
          media.currentTime = Math.max(0, Math.min(media.duration || 0, media.currentTime + (e.key === "ArrowLeft" ? -5 : 5)));
        } else if (e.key === "m") muteBtn.click();
        else if (e.key === "f" && video) fullscreen();
      });
      if (track) track.track.mode = "hidden";
      syncPlay();
      syncVolume();
    }
  }
  function initPricing(root2) {
    for (const box2 of $$3("[data-xz-pricing]", root2)) {
      if (ready3(box2)) continue;
      const apply = (value) => {
        for (const el of $$3(`[data-${value}]`, box2)) el.textContent = el.getAttribute(`data-${value}`);
        fire3(box2, "xz:period", { period: value });
      };
      box2.addEventListener("change", (e) => {
        if (e.target.matches('input[type="radio"]')) apply(e.target.value);
      });
      const checked = box2.querySelector('input[type="radio"]:checked');
      if (checked) apply(checked.value);
    }
  }
  function initComponents(root2, helpers2 = {}) {
    if (helpers2.icon) icon = helpers2.icon;
    if (helpers2.validateField) validateField = helpers2.validateField;
    bindGlobal2();
    initPopovers(root2);
    initNotifications(root2);
    initMegaMenus(root2);
    initContextMenus(root2);
    initSearches(root2);
    initSheets(root2);
    initWizards(root2);
    initCarousels(root2);
    initLightboxes(root2);
    initPlayers(root2);
    initPricing(root2);
  }

  // src/js/table.js
  var find = (s) => {
    if (!s) return null;
    try {
      return document.querySelector(s);
    } catch {
      return null;
    }
  };
  var slug = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  var collator = typeof Intl !== "undefined" ? new Intl.Collator("en-IN", { numeric: true, sensitivity: "base" }) : { compare: (a, b) => a < b ? -1 : a > b ? 1 : 0 };
  function initTables(root2, { icon: icon4 = () => "", init: init2 } = {}) {
    for (const table of $$2("table[data-xz-table]", root2)) {
      if (table.xzReady || !table.tBodies[0] || !table.tHead) continue;
      table.xzReady = true;
      bindGlobal2();
      setup(table, { icon: icon4, init: init2 });
    }
  }
  function setup(table, { icon: icon4, init: init2 }) {
    const tbody = table.tBodies[0];
    const heads = Array.from(table.tHead.rows[0].cells);
    const name = table.getAttribute("data-xz-table") || table.id || "";
    const ref = table.id ? `#${table.id}` : null;
    const linked = (attr) => ref ? $$2(`[${attr}]`).filter((el) => el.getAttribute(attr) === ref) : [];
    const pageSize = Number(table.getAttribute("data-xz-page-size")) || 0;
    const pager = find(table.getAttribute("data-xz-pagination"));
    const searchEl = find(table.getAttribute("data-xz-search"));
    const empty = find(table.getAttribute("data-xz-empty"));
    const live2 = Object.assign(document.createElement("div"), { className: "xz-sr-only" });
    live2.setAttribute("aria-live", "polite");
    const carry = document.createElement("div");
    carry.hidden = true;
    table.after(carry, live2);
    const say = (text) => {
      live2.textContent = "";
      setTimeout(() => live2.textContent = text, 50);
    };
    const cols = heads.map((th, i) => ({
      th,
      i,
      key: th.getAttribute("data-xz-key") || slug(th.textContent) || `column-${i + 1}`,
      label: th.textContent.trim().replace(/\s+/g, " "),
      check: th.classList.contains("xz-table__check") || Boolean(th.querySelector("[data-xz-select-all]")),
      actions: th.classList.contains("xz-table__actions"),
      fixed: th.hasAttribute("data-xz-fixed")
    }));
    const dataCols = cols.filter((c) => !c.check && !c.actions);
    const byKey = (key) => cols.find((c) => c.key === key);
    let rows = [];
    const selected = /* @__PURE__ */ new Set();
    let anchor = null;
    let list = [];
    let shown = [];
    const state = { page: 1, sort: -1, dir: 1, type: "text", query: "", terms: [], filters: /* @__PURE__ */ new Map() };
    const scan = (trs) => {
      const out = [];
      for (const tr of trs) {
        if (tr.classList.contains("xz-table__detail")) {
          const owner = out[out.length - 1];
          if (owner) owner.detail = tr;
          continue;
        }
        out.push({ tr, detail: null, box: tr.querySelector("input[data-xz-select]"), text: null });
      }
      return out;
    };
    const prepare = (row) => {
      var _a, _b;
      if ((_a = row.box) == null ? void 0 : _a.checked) selected.add(row);
      row.tr.classList.toggle("is-selected", selected.has(row));
      const btns = $$2("[data-xz-expand]", row.tr);
      if (row.detail) {
        (_b = row.detail).id || (_b.id = nextId("detail"));
        const open = btns.some((b) => b.getAttribute("aria-expanded") === "true");
        row.detail.hidden = !open;
        for (const b of btns) {
          b.setAttribute("aria-controls", row.detail.id);
          b.setAttribute("aria-expanded", String(open));
        }
      } else btns.forEach((b) => b.hidden = true);
    };
    rows = scan(Array.from(tbody.rows));
    rows.forEach(prepare);
    const textOf = (row) => {
      var _a;
      return (_a = row.text) != null ? _a : row.text = dataCols.map((c) => {
        var _a2;
        return ((_a2 = row.tr.cells[c.i]) == null ? void 0 : _a2.textContent) || "";
      }).join(" ").replace(/\s+/g, " ").toLowerCase();
    };
    const raw = (row, c) => {
      var _a;
      const cell = row.tr.cells[c.i];
      return cell ? (_a = cell.getAttribute("data-value")) != null ? _a : cell.textContent.trim() : "";
    };
    const sortValue = (row, c, type) => {
      const v = raw(row, c);
      if (type === "number") {
        const n = parse(v);
        return Number.isNaN(n) ? 0 : n;
      }
      if (type === "date") return new Date(v).getTime() || 0;
      return String(v);
    };
    const compare = (x, y) => typeof x === "string" ? collator.compare(x, y) : x - y;
    const matches = (row) => {
      if (state.terms.length) {
        const t = textOf(row);
        if (!state.terms.every((q) => t.includes(q))) return false;
      }
      for (const [key, values] of state.filters) {
        if (!values.size) continue;
        const c = byKey(key);
        if (c && !values.has(String(raw(row, c)).toLowerCase())) return false;
      }
      return true;
    };
    const colStore = name ? `xz-table-columns:${name}` : null;
    const startHidden = cols.filter((c) => c.th.hasAttribute("data-xz-hidden")).map((c) => c.key);
    const hiddenKeys = new Set(colStore && store.get(colStore, null) || startHidden);
    const canHide = (c) => !c.fixed && !c.check && !c.actions;
    const applyColumns = () => {
      for (const c of cols) {
        const hide = canHide(c) && hiddenKeys.has(c.key);
        c.th.hidden = hide;
        for (const r of rows) {
          const cell = r.tr.cells[c.i];
          if (cell) cell.hidden = hide;
        }
      }
      const count = cols.filter((c) => !c.th.hidden).length;
      for (const r of rows) if (r.detail && r.detail.cells.length === 1) r.detail.cells[0].colSpan = count;
    };
    const setColumn = (key, show2) => {
      if (show2) hiddenKeys.delete(key);
      else hiddenKeys.add(key);
      if (colStore) store.set(colStore, [...hiddenKeys]);
      applyColumns();
      for (const box2 of $$2(`input[data-xz-column-key="${key}"]`)) box2.checked = show2;
      fire2(table, "xz:columns", { hidden: [...hiddenKeys] });
    };
    let observer = null;
    const filtersNow = () => Object.fromEntries([...state.filters].filter(([, v]) => v.size).map(([k, v]) => [k, [...v]]));
    const update2 = () => {
      var _a;
      const next = rows.filter(matches);
      if (state.sort >= 0) {
        const c = cols[state.sort];
        next.sort((a, b) => compare(sortValue(a, c, state.type), sortValue(b, c, state.type)) * state.dir);
      }
      list = next;
      const total = list.length;
      const pages = pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1;
      state.page = Math.min(Math.max(1, state.page), pages);
      const from = pageSize ? (state.page - 1) * pageSize : 0;
      shown = pageSize ? list.slice(from, from + pageSize) : list;
      tbody.replaceChildren(...shown.flatMap((r) => r.detail ? [r.tr, r.detail] : [r.tr]));
      observer == null ? void 0 : observer.takeRecords();
      if (empty) empty.hidden = total > 0;
      (_a = table.closest(".xz-table-wrap")) == null ? void 0 : _a.toggleAttribute("hidden", Boolean(empty) && total === 0);
      if (pager) renderPager(pager, { page: state.page, pages, total, from, count: shown.length, go: (p) => (state.page = p, update2()) });
      syncSelection();
      fire2(table, "xz:table", { total, page: state.page, pages, query: state.query, filters: filtersNow(), sort: state.sort >= 0 ? { key: cols[state.sort].key, dir: state.dir === 1 ? "ascending" : "descending" } : null, selected: selected.size });
    };
    const refilter = () => {
      state.page = 1;
      update2();
      if (!pager) say(list.length ? `${list.length} result${list.length === 1 ? "" : "s"}` : "No results");
    };
    const setSort = (col, dir) => {
      const th = cols[col].th;
      state.dir = dir != null ? dir : state.sort === col ? -state.dir : 1;
      state.sort = col;
      state.type = th.getAttribute("data-xz-sort") || "text";
      state.page = 1;
      heads.forEach((h) => h.hasAttribute("aria-sort") && h.setAttribute("aria-sort", "none"));
      th.setAttribute("aria-sort", state.dir === 1 ? "ascending" : "descending");
      update2();
    };
    heads.forEach((th, col) => {
      if (!th.hasAttribute("data-xz-sort")) return;
      const btn = Object.assign(document.createElement("button"), { type: "button", className: "xz-table__sort" });
      btn.append(...th.childNodes);
      th.append(btn);
      th.setAttribute("aria-sort", "none");
      btn.addEventListener("click", () => setSort(col));
    });
    const setQuery = (q) => {
      state.query = String(q).trim().toLowerCase();
      state.terms = state.query.split(/\s+/).filter(Boolean);
      refilter();
    };
    searchEl == null ? void 0 : searchEl.addEventListener("input", () => setQuery(searchEl.value));
    const setFilter = (key, values) => {
      state.filters.set(key, new Set(values.filter((v) => v !== "" && v != null).map((v) => String(v).toLowerCase())));
      refilter();
    };
    const filterEls = linked("data-xz-filter");
    const pressedValues = (el) => $$2('button[aria-pressed="true"]', el).map((b) => b.value || b.textContent.trim());
    for (const el of filterEls) {
      const key = el.getAttribute("data-xz-column");
      const c = byKey(key);
      if (!c) {
        console.warn(`[Xsenze] No column "${key}" in the table for this filter. Use the column's data-xz-key or its heading text.`);
        continue;
      }
      if (el.tagName === "SELECT") {
        if (el.getAttribute("data-xz-options") === "auto") {
          const have = new Set($$2("option", el).map((o) => o.value.toLowerCase()));
          const values = [...new Set(rows.map((r) => raw(r, c)).filter(Boolean))].sort(collator.compare);
          for (const v of values) if (!have.has(v.toLowerCase())) el.append(new Option(v, v));
        }
        if (el.value) state.filters.set(key, /* @__PURE__ */ new Set([el.value.toLowerCase()]));
        el.addEventListener("change", () => setFilter(key, [el.value]));
      } else {
        const start = pressedValues(el);
        if (start.length) state.filters.set(key, new Set(start.map((v) => v.toLowerCase())));
        el.addEventListener("xz:press", () => setFilter(key, pressedValues(el)));
      }
      const form = el.form || el.closest("form");
      if (form && !form.xzLiveFilter) {
        form.xzLiveFilter = true;
        for (const b of $$2("[data-xz-filter-submit]", form)) b.hidden = true;
        if (form.querySelector("[data-xz-filter-submit]")) form.addEventListener("submit", (e) => e.preventDefault());
      }
    }
    for (const btn of linked("data-xz-filter-clear")) {
      btn.addEventListener("click", () => {
        for (const el of filterEls) {
          if (el.tagName === "SELECT") el.value = "";
          else $$2("button[aria-pressed]", el).forEach((b) => b.setAttribute("aria-pressed", "false"));
        }
        state.filters.clear();
        if (searchEl) searchEl.value = "";
        state.query = "";
        state.terms = [];
        refilter();
      });
    }
    const selectAll = table.tHead.querySelector("input[data-xz-select-all]");
    const bars2 = linked("data-xz-bulk");
    const setRow = (row, on) => {
      if (!row.box || row.box.disabled) return;
      row.box.checked = on;
      if (on) selected.add(row);
      else selected.delete(row);
      row.tr.classList.toggle("is-selected", on);
    };
    const ids = () => [...selected].map((r) => r.box.value);
    const syncSelection = () => {
      if (selectAll) {
        const boxes = shown.filter((r) => r.box && !r.box.disabled);
        const n = boxes.filter((r) => selected.has(r)).length;
        selectAll.checked = boxes.length > 0 && n === boxes.length;
        selectAll.indeterminate = n > 0 && n < boxes.length;
      }
      const onPage = new Set(shown);
      carry.replaceChildren(...[...selected].filter((r) => !onPage.has(r) && r.box.name).map((r) => Object.assign(document.createElement("input"), { type: "hidden", name: r.box.name, value: r.box.value })));
      const inList = new Set(list);
      const selectable = list.filter((r) => r.box && !r.box.disabled);
      for (const bar of bars2) {
        bar.hidden = selected.size === 0;
        const count = bar.querySelector("[data-xz-bulk-count]");
        if (count) {
          const away = [...selected].filter((r) => !inList.has(r)).length;
          count.textContent = `${selected.size} selected${away ? `, ${away} not shown` : ""}`;
        }
        const all = bar.querySelector("[data-xz-bulk-all]");
        if (all) {
          const pageDone = shown.every((r) => !r.box || selected.has(r));
          all.hidden = !pageDone || selectable.length <= shown.length || selectable.every((r) => selected.has(r));
          const tpl = all.getAttribute("data-xz-bulk-all");
          all.textContent = (tpl && tpl.includes("{n}") ? tpl : "Select all {n} results").replace("{n}", selectable.length);
        }
      }
    };
    const changed2 = () => {
      syncSelection();
      say(selected.size ? `${selected.size} row${selected.size === 1 ? "" : "s"} selected` : "No rows selected");
      fire2(table, "xz:selection", { count: selected.size, rows: [...selected].map((r) => r.tr), ids: ids(), all: list.length > 0 && list.every((r) => !r.box || selected.has(r)) });
    };
    selectAll == null ? void 0 : selectAll.addEventListener("change", () => {
      for (const r of shown) setRow(r, selectAll.checked);
      anchor = null;
      changed2();
    });
    const select = (what, on = true) => {
      const target2 = what === "all" ? list : what === "page" ? shown : what === "none" ? rows : rows.filter((r) => [].concat(what).includes(r.tr));
      for (const r of target2) setRow(r, what === "none" ? false : on);
      changed2();
    };
    for (const bar of bars2) {
      bar.hidden = true;
      if (!bar.hasAttribute("role")) bar.setAttribute("role", "region");
      if (!bar.hasAttribute("aria-label")) bar.setAttribute("aria-label", "Selected rows");
      bar.addEventListener("click", (e) => {
        if (e.target.closest("[data-xz-bulk-clear]")) return select("none");
        if (e.target.closest("[data-xz-bulk-all]")) return select("all");
        const act = e.target.closest("[data-xz-bulk-action]");
        if (act && !fire2(table, "xz:bulk", { action: act.getAttribute("data-xz-bulk-action"), rows: [...selected].map((r) => r.tr), ids: ids() }, true)) e.preventDefault();
      });
    }
    const expand = (row, open = Boolean(((_a) => (_a = row.detail) == null ? void 0 : _a.hidden)())) => {
      if (!row.detail) return;
      row.detail.hidden = !open;
      row.tr.classList.toggle("is-expanded", open);
      for (const b of $$2("[data-xz-expand]", row.tr)) b.setAttribute("aria-expanded", String(open));
      fire2(table, "xz:expand", { row: row.tr, open });
    };
    tbody.addEventListener("click", (e) => {
      const box2 = e.target.closest("input[data-xz-select]");
      if (box2) {
        const row = rows.find((r) => r.box === box2);
        if (!row) return;
        const a = anchor ? list.indexOf(anchor) : -1;
        const b = list.indexOf(row);
        if (e.shiftKey && a >= 0 && b >= 0 && a !== b) for (const r of list.slice(Math.min(a, b), Math.max(a, b) + 1)) setRow(r, box2.checked);
        else setRow(row, box2.checked);
        anchor = row;
        changed2();
        return;
      }
      const btn = e.target.closest("[data-xz-expand]");
      if (btn) {
        const row = rows.find((r) => r.tr.contains(btn));
        if (row) expand(row);
      }
    });
    const csv = ({ rows: which = "filtered" } = {}) => {
      const out = dataCols.filter((c) => !c.th.hidden);
      const pick = which === "all" ? rows : which === "selected" ? rows.filter((r) => selected.has(r)) : list;
      const cell = (v) => {
        let s = String(v != null ? v : "").replace(/\s+/g, " ").trim();
        if (/^[=+\-@]/.test(s) && Number.isNaN(Number(s))) s = `'${s}`;
        return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      return [out.map((c) => cell(c.label)).join(","), ...pick.map((r) => out.map((c) => cell(raw(r, c))).join(","))].join("\r\n");
    };
    const download = (opts = {}) => {
      const blob = new Blob(["\uFEFF" + csv(opts)], { type: "text/csv;charset=utf-8" });
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: opts.filename || `${name || "table"}.csv` });
      document.body.append(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 0);
    };
    for (const btn of linked("data-xz-export")) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        download({ rows: btn.getAttribute("data-xz-rows") || "filtered", filename: btn.getAttribute("data-xz-filename") || void 0 });
      });
    }
    for (const holder of linked("data-xz-columns")) {
      holder.classList.add("xz-table-columns");
      let trigger = holder.querySelector(":scope > button");
      if (!trigger) {
        trigger = Object.assign(document.createElement("button"), { type: "button", className: "xz-btn xz-btn--sm" });
        trigger.innerHTML = `${icon4("columns-3", { size: "sm" })}<span>Columns</span>`;
        holder.append(trigger);
      }
      const panel = Object.assign(document.createElement("div"), { className: "xz-popover__panel xz-table-columns__panel" });
      panel.setAttribute("role", "group");
      panel.setAttribute("aria-label", "Columns to show");
      panel.tabIndex = -1;
      for (const c of cols.filter(canHide)) {
        const label = Object.assign(document.createElement("label"), { className: "xz-check" });
        const box2 = Object.assign(document.createElement("input"), { type: "checkbox", checked: !hiddenKeys.has(c.key) });
        box2.setAttribute("data-xz-column-key", c.key);
        box2.addEventListener("change", () => setColumn(c.key, box2.checked));
        label.append(box2, Object.assign(document.createElement("span"), { textContent: c.label }));
        panel.append(label);
      }
      holder.append(panel);
      floating({ wrapper: holder, trigger, panel, focusPanel: true, position: () => place(panel, trigger, { align: "end", gap: 6 }) });
    }
    const refresh = () => {
      const known = new Set(rows.flatMap((r) => [r.tr, r.detail]).filter(Boolean));
      const gone = new Set(shown.filter((r) => !r.tr.isConnected));
      rows = rows.filter((r) => !gone.has(r));
      for (const r of gone) selected.delete(r);
      const fresh = scan(Array.from(tbody.rows).filter((tr) => !known.has(tr)));
      fresh.forEach(prepare);
      rows.push(...fresh);
      applyColumns();
      update2();
    };
    const replace = (input) => {
      let trs;
      if (typeof input === "string") {
        const t = document.createElement("template");
        t.innerHTML = `<table><tbody>${input}</tbody></table>`;
        trs = Array.from(t.content.querySelector("tbody").rows);
      } else trs = Array.from(input);
      const frag = document.createDocumentFragment();
      frag.append(...trs);
      init2 == null ? void 0 : init2(frag);
      selected.clear();
      anchor = null;
      rows = scan(trs);
      rows.forEach(prepare);
      state.page = 1;
      applyColumns();
      update2();
    };
    if (table.hasAttribute("data-xz-table-live") && typeof MutationObserver === "function") {
      let queued = false;
      observer = new MutationObserver(() => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          refresh();
        });
      });
      observer.observe(tbody, { childList: true });
    }
    table.xzTable = {
      refresh,
      replace,
      rows: () => rows.map((r) => r.tr),
      filtered: () => list.map((r) => r.tr),
      visible: () => shown.map((r) => r.tr),
      go: (p) => (state.page = p, update2()),
      sort: (key, dir = "ascending") => {
        const c = byKey(key);
        if (c) setSort(c.i, dir === "descending" ? -1 : 1);
      },
      search: (q) => {
        if (searchEl) searchEl.value = q;
        setQuery(q);
      },
      filter: (key, values) => setFilter(key, [].concat(values != null ? values : [])),
      select,
      selected: () => [...selected].map((r) => r.tr),
      expand: (tr, open) => {
        const row = rows.find((r) => r.tr === tr);
        if (row) expand(row, open);
      },
      columns: { hide: (k) => setColumn(k, false), show: (k) => setColumn(k, true), toggle: (k) => setColumn(k, hiddenKeys.has(k)), hidden: () => [...hiddenKeys] },
      csv,
      download
    };
    applyColumns();
    update2();
  }
  function renderPager(el, { page, pages, total, from, count, go }) {
    el.innerHTML = "";
    el.classList.add("xz-pagination");
    el.setAttribute("role", "navigation");
    el.setAttribute("aria-label", "Pagination");
    const info = Object.assign(document.createElement("span"), { className: "xz-pagination__info", textContent: total ? `Showing ${from + 1} to ${from + count} of ${total}` : "No results" });
    info.setAttribute("aria-live", "polite");
    el.append(info);
    const button = (label, target2, { current: current2, disabled, aria } = {}) => {
      const b = Object.assign(document.createElement("button"), { type: "button", className: "xz-pagination__item", textContent: label, disabled: Boolean(disabled) });
      if (aria) b.setAttribute("aria-label", aria);
      if (current2) b.setAttribute("aria-current", "page");
      b.addEventListener("click", () => go(target2));
      el.append(b);
    };
    button("\u2190", page - 1, { disabled: page <= 1, aria: "Previous page" });
    const nums = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
    let last = 0;
    for (const n of [...nums].sort((a, b) => a - b)) {
      if (n - last > 1) el.append(Object.assign(document.createElement("span"), { className: "xz-pagination__gap", textContent: "\u2026" }));
      button(String(n), n, { current: n === page, aria: `Page ${n}` });
      last = n;
    }
    button("\u2192", page + 1, { disabled: page >= pages, aria: "Next page" });
  }

  // src/js/command.js
  var icon2 = () => "";
  var openDialog = (d) => d.showModal();
  var closeDialog = (d) => d.close();
  var bound2 = false;
  var shared = null;
  var extra = /* @__PURE__ */ new Map();
  var fromLi = (li, i) => ({
    id: li.dataset.id || "",
    label: li.textContent.trim(),
    group: li.dataset.group || "",
    href: li.dataset.href || "",
    action: li.dataset.action || "",
    icon: li.dataset.icon || "",
    meta: li.dataset.meta || "",
    keywords: li.dataset.keywords || "",
    kbd: li.dataset.kbd || "",
    pin: li.hasAttribute("data-pin"),
    order: i
  });
  var keyOf = (item) => item.id || `${item.group}|${item.label}|${item.href}`;
  function initCommands(root2, helpers2 = {}) {
    if (helpers2.icon) icon2 = helpers2.icon;
    if (helpers2.openDialog) openDialog = helpers2.openDialog;
    if (helpers2.closeDialog) closeDialog = helpers2.closeDialog;
    for (const dlg of $$2("dialog[data-xz-command]", root2)) if (!dlg.xzCommand) build(dlg);
    if (!bound2 && typeof document !== "undefined") {
      bound2 = true;
      document.addEventListener("keydown", (e) => {
        var _a;
        for (const dlg of $$2("dialog[data-xz-command]")) {
          const sc = (_a = dlg.xzCommand) == null ? void 0 : _a.shortcut;
          if (!sc || !matchShortcut(e, sc)) continue;
          if (dlg.open) {
            e.preventDefault();
            closeDialog(dlg);
            return;
          }
          if (typing(e.target) && !e.target.closest(".xz-command-palette")) return;
          e.preventDefault();
          dlg.xzCommand.open();
          return;
        }
      });
    }
  }
  function build(dlg) {
    var _a, _b;
    dlg.classList.add("xz-command-palette");
    if (!dlg.hasAttribute("aria-label") && !dlg.hasAttribute("aria-labelledby")) dlg.setAttribute("aria-label", "Command menu");
    const listId = nextId("command");
    const source2 = dlg.querySelector(".xz-command-palette__source");
    const sourceItems = source2 ? $$2(":scope > li", source2).map(fromLi) : [];
    let input = dlg.querySelector(".xz-command-palette__input");
    const head = document.createElement("div");
    head.className = "xz-command-palette__search";
    head.innerHTML = icon2("search", { size: "sm" });
    if (!input) {
      input = document.createElement("input");
      input.className = "xz-command-palette__input";
      input.placeholder = dlg.getAttribute("data-xz-placeholder") || "Type a command or search";
    }
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-expanded", "true");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", listId);
    if (!input.hasAttribute("aria-label") && !((_a = input.labels) == null ? void 0 : _a.length)) input.setAttribute("aria-label", dlg.getAttribute("aria-label") || "Search");
    const esc_ = Object.assign(document.createElement("kbd"), { className: "xz-kbd", textContent: "Esc" });
    esc_.setAttribute("aria-hidden", "true");
    head.append(input, esc_);
    const list = Object.assign(document.createElement("div"), { className: "xz-command-palette__list", id: listId });
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", "Results");
    const note = Object.assign(document.createElement("p"), { className: "xz-command-palette__note", hidden: true });
    const foot = Object.assign(document.createElement("div"), { className: "xz-command-palette__footer" });
    foot.setAttribute("aria-hidden", "true");
    foot.innerHTML = '<span><kbd class="xz-kbd">\u2191</kbd><kbd class="xz-kbd">\u2193</kbd> to move</span><span><kbd class="xz-kbd">Enter</kbd> to open</span><span><kbd class="xz-kbd">Esc</kbd> to close</span>';
    const status = Object.assign(document.createElement("div"), { className: "xz-sr-only" });
    status.setAttribute("aria-live", "polite");
    dlg.replaceChildren(...[source2].filter(Boolean), head, list, note, foot, status);
    const shortcut = parseShortcut((_b = dlg.getAttribute("data-xz-shortcut")) != null ? _b : dlg === shared ? "none" : "mod+k");
    const max = Number(dlg.getAttribute("data-xz-max")) || 50;
    const url = dlg.getAttribute("data-xz-command-url");
    const minLength = Number(dlg.getAttribute("data-xz-min-length") || 2);
    const searchUrl = dlg.getAttribute("data-xz-command-search");
    const state = { items: sourceItems, providers: [], recent: dlg.getAttribute("data-xz-recent") || "", opener: null, resolve: null, shown: [], active: -1, remote: [], pending: null, timer: 0, announce: 0, chosen: null };
    if (shortcut) {
      for (const t of $$2(`[data-xz-open="#${dlg.id}"]`)) if (dlg.id && !t.hasAttribute("aria-keyshortcuts")) t.setAttribute("aria-keyshortcuts", ariaShortcut(shortcut));
    }
    const recent = () => recentList(state.recent ? `xz-command-recent:${state.recent}` : "", { max: 5, same: (a, b) => keyOf(a) === keyOf(b) });
    const allItems = () => {
      const out = [...state.items];
      for (const x of extra.get(dlg) || []) if (Array.isArray(x)) out.push(...x);
      return out;
    };
    const providers = () => [...state.providers, ...[...extra.get(dlg) || []].filter((x) => typeof x === "function")];
    const setActive = (i) => {
      state.active = i;
      const opts = list.querySelectorAll('[role="option"]');
      opts.forEach((el2, n) => {
        const on = n === i;
        el2.classList.toggle("is-active", on);
        el2.setAttribute("aria-selected", String(on));
      });
      const el = opts[i];
      if (el) {
        input.setAttribute("aria-activedescendant", el.id);
        keepInView(list, el);
      } else input.removeAttribute("aria-activedescendant");
    };
    const render = () => {
      const q = input.value.trim();
      const terms = termsOf(q);
      const recentKeys = new Set(recent().get().map(keyOf));
      let groups = [];
      const add = (name, items) => items.length && groups.push({ name, items });
      if (!terms.length) {
        const saved = recent().get();
        add("Recent", saved.map((r) => ({ ...r, group: "Recent" })));
        const all = allItems();
        const pinned = all.some((i) => i.pin) ? all.filter((i) => i.pin) : all;
        const byGroup = /* @__PURE__ */ new Map();
        for (const it of pinned.filter((i) => !recentKeys.has(keyOf(i))).slice(0, max)) {
          if (!byGroup.has(it.group)) byGroup.set(it.group, []);
          byGroup.get(it.group).push(it);
        }
        for (const [name, items] of byGroup) add(name, items);
      } else {
        const best = ranked(allItems(), terms, { boost: (it) => recentKeys.has(keyOf(it)) ? 15 : 0 }).slice(0, max);
        const byGroup = /* @__PURE__ */ new Map();
        for (const it of best) {
          if (!byGroup.has(it.group)) byGroup.set(it.group, []);
          byGroup.get(it.group).push(it);
        }
        for (const [name, items] of byGroup) add(name, items);
        const seen = new Set(best.map(keyOf));
        const remoteByGroup = /* @__PURE__ */ new Map();
        for (const it of state.remote.filter((r) => !seen.has(keyOf(r)))) {
          if (!remoteByGroup.has(it.group)) remoteByGroup.set(it.group, []);
          remoteByGroup.get(it.group).push(it);
        }
        for (const [name, items] of remoteByGroup) {
          const existing = groups.find((g) => g.name === name);
          if (existing) existing.items.push(...items);
          else add(name, items);
        }
        if (searchUrl) add("", [{ label: `Search for \u201C${q}\u201D`, href: searchUrl.replace("{q}", encodeURIComponent(q)), icon: "search", kind: "query" }]);
      }
      state.shown = groups.flatMap((g) => g.items);
      let n = 0;
      list.innerHTML = groups.map((g, gi) => {
        const gid = `${listId}-g${gi}`;
        const head2 = g.name ? `<div class="xz-command-palette__group" id="${gid}" role="presentation">${esc2(g.name)}</div>` : "";
        const opts = g.items.map((it) => {
          const i = n++;
          const lead = it.icon ? icon2(it.icon, { size: "sm" }) : "";
          const label = it.kind === "query" ? esc2(it.label) : highlight(it.label, terms);
          return `<div role="option" id="${listId}-${i}" class="xz-command-palette__option" data-index="${i}" aria-selected="false">${lead}<span class="xz-command-palette__label">${label}</span>${it.meta ? `<span class="xz-command-palette__meta">${esc2(it.meta)}</span>` : ""}${it.kbd ? `<kbd class="xz-kbd" aria-hidden="true">${esc2(it.kbd)}</kbd>` : ""}</div>`;
        }).join("");
        return `<div role="group"${g.name ? ` aria-labelledby="${gid}"` : ' aria-label="More"'}>${head2}${opts}</div>`;
      }).join("");
      const count = state.shown.filter((it) => it.kind !== "query").length;
      note.hidden = !(state.pending || terms.length && count === 0);
      note.textContent = state.pending ? "Searching\u2026" : `No results for \u201C${q}\u201D`;
      setActive(state.shown.length ? 0 : -1);
      clearTimeout(state.announce);
      state.announce = setTimeout(() => status.textContent = terms.length ? count ? `${count} result${count === 1 ? "" : "s"}` : "No results" : "", 400);
    };
    const askRemote = () => {
      var _a2;
      clearTimeout(state.timer);
      (_a2 = state.pending) == null ? void 0 : _a2.abort();
      state.pending = null;
      state.remote = [];
      const q = input.value.trim();
      const sources = providers();
      if (!q || !sources.length && !(url && q.length >= minLength)) return render();
      const ctrl = new AbortController();
      state.pending = ctrl;
      state.timer = setTimeout(async () => {
        const [found, server] = await Promise.all([
          Promise.all(sources.map((p) => Promise.resolve(p(q, { signal: ctrl.signal })).catch(() => []))).then((a) => a.flat().filter((it) => it && it.label)),
          url && q.length >= minLength ? fetchItems(url, q, ctrl.signal).catch(() => []) : []
        ]);
        if (ctrl.signal.aborted || input.value.trim() !== q) return;
        state.remote = [...ranked(found, termsOf(q)), ...server];
        state.pending = null;
        render();
      }, 150);
      render();
    };
    const finish = (item) => {
      const resolve = state.resolve;
      state.resolve = null;
      resolve == null ? void 0 : resolve(item);
    };
    const choose = (item, { newTab = false } = {}) => {
      if (!item) return;
      const q = input.value.trim();
      const ok = fire2(dlg, "xz:command", { item, query: q, action: item.action || null }, true);
      if (item.kind !== "query") recent().add({ id: item.id || "", label: item.label, group: item.group || "", href: item.href || "", icon: item.icon || "", action: item.action || "", meta: item.meta || "" });
      state.chosen = item;
      closeDialog(dlg);
      if (!ok) return;
      if (typeof item.run === "function") item.run(item);
      else if (item.href) {
        if (newTab) window.open(item.href, "_blank", "noopener");
        else location.assign(item.href);
      }
    };
    input.addEventListener("input", askRemote);
    input.addEventListener("keydown", (e) => {
      const count = state.shown.length;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (count) setActive((state.active + (e.key === "ArrowDown" ? 1 : -1) + count) % count);
      } else if (e.key === "PageDown" || e.key === "PageUp") {
        e.preventDefault();
        if (count) setActive(Math.max(0, Math.min(count - 1, state.active + (e.key === "PageDown" ? 8 : -8))));
      } else if (e.key === "Enter") {
        if (composing(e)) return;
        e.preventDefault();
        choose(state.shown[state.active], { newTab: e.ctrlKey || e.metaKey });
      }
    });
    list.addEventListener("pointerdown", (e) => e.preventDefault());
    list.addEventListener("click", (e) => {
      const el = e.target.closest('[role="option"]');
      if (el) choose(state.shown[Number(el.dataset.index)], { newTab: e.ctrlKey || e.metaKey });
    });
    list.addEventListener("pointermove", (e) => {
      const el = e.target.closest('[role="option"]');
      if (el && Number(el.dataset.index) !== state.active) setActive(Number(el.dataset.index));
    });
    dlg.addEventListener("close", () => {
      var _a2;
      clearTimeout(state.timer);
      (_a2 = state.pending) == null ? void 0 : _a2.abort();
      state.pending = null;
      if (!state.chosen) finish(null);
      else finish(state.chosen);
      state.chosen = null;
      const back = state.opener;
      state.opener = null;
      input.value = "";
      state.remote = [];
      fire2(dlg, "xz:close");
      if ((back == null ? void 0 : back.isConnected) && typeof back.focus === "function") back.focus({ preventScroll: true });
    });
    const open = (opts = {}) => {
      if (opts.items) state.items = opts.items.map((it, i) => ({ order: i, ...it }));
      if (opts.providers) state.providers = [].concat(opts.providers);
      if (opts.placeholder) input.placeholder = opts.placeholder;
      if ("recent" in opts) state.recent = opts.recent || "";
      return new Promise((resolve) => {
        if (dlg.open) {
          finish(null);
          state.resolve = resolve;
          input.select();
          return;
        }
        closeAll();
        state.opener = document.activeElement;
        state.resolve = resolve;
        state.chosen = null;
        input.value = opts.query || "";
        render();
        if (input.value) askRemote();
        openDialog(dlg);
        input.focus();
        fire2(dlg, "xz:open");
      });
    };
    if (dlg.id) {
      document.addEventListener(
        "click",
        (e) => {
          var _a2, _b2;
          const t = (_b2 = (_a2 = e.target).closest) == null ? void 0 : _b2.call(_a2, "[data-xz-open]");
          if (t && t.getAttribute("data-xz-open") === `#${dlg.id}`) state.opener = t;
        },
        true
      );
    }
    new MutationObserver(() => {
      if (!dlg.open || state.resolve) return;
      closeAll();
      state.chosen = null;
      render();
      input.focus();
    }).observe(dlg, { attributes: true, attributeFilter: ["open"] });
    dlg.xzCommand = {
      open,
      close: () => closeDialog(dlg),
      setItems: (items) => {
        state.items = items.map((it, i) => ({ order: i, ...it }));
        if (dlg.open) render();
      },
      refresh: () => dlg.open && render(),
      shortcut
    };
    return dlg;
  }
  function sharedDialog() {
    if (shared && shared.isConnected) return shared;
    shared = document.createElement("dialog");
    shared.setAttribute("data-xz-command", "");
    shared.setAttribute("data-xz-shortcut", "none");
    document.body.append(shared);
    build(shared);
    return shared;
  }
  var resolveTarget = (target2) => typeof target2 === "string" ? document.querySelector(target2) : target2 instanceof Element ? target2 : null;
  var command = {
    open(target2, options) {
      const el = resolveTarget(target2);
      if (el) {
        if (!el.xzCommand) build(el);
        return el.xzCommand.open(options || {});
      }
      const dlg = sharedDialog();
      return dlg.xzCommand.open(target2 || {});
    },
    close() {
      for (const d of $$2("dialog[data-xz-command][open]")) closeDialog(d);
    },
    /** Add items (an array) or a provider function (query, { signal }) => items to a palette. Returns a function that removes them. */
    register(itemsOrProvider, { palette } = {}) {
      const dlg = resolveTarget(palette) || document.querySelector("dialog[data-xz-command]") || sharedDialog();
      if (!dlg.xzCommand) build(dlg);
      if (!extra.has(dlg)) extra.set(dlg, /* @__PURE__ */ new Set());
      const value = Array.isArray(itemsOrProvider) ? itemsOrProvider.map((it, i) => ({ order: i, ...it })) : itemsOrProvider;
      extra.get(dlg).add(value);
      dlg.xzCommand.refresh();
      return () => {
        var _a;
        (_a = extra.get(dlg)) == null ? void 0 : _a.delete(value);
        dlg.xzCommand.refresh();
      };
    }
  };

  // src/js/sparkline.js
  function initSparklines(root2) {
    for (const el of $$2("[data-xz-sparkline]", root2)) {
      const values = el.getAttribute("data-xz-sparkline").split(/[\s,]+/).filter(Boolean).map(Number).filter(Number.isFinite);
      if (values.length < 2) continue;
      const w = 100;
      const h = 30;
      const min = Math.min(...values);
      const span = Math.max(...values) - min || 1;
      const pts = values.map((v, i) => [i / (values.length - 1) * w, h - 2 - (v - min) / span * (h - 4)]);
      const d = "M" + pts.map((p) => p.map((n) => Math.round(n * 10) / 10).join(" ")).join("L");
      const area = el.hasAttribute("data-xz-sparkline-area") ? `<path class="xz-sparkline__area" d="${d}L${w} ${h}L0 ${h}Z"/>` : "";
      const [, lastY] = pts[pts.length - 1];
      el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${area}<path class="xz-sparkline__line" d="${d}" vector-effect="non-scaling-stroke"/></svg><i class="xz-sparkline__dot" style="top:${Math.round(lastY / h * 1e3) / 10}%"></i>`;
      if (!el.hasAttribute("role")) el.setAttribute("role", "img");
      if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", `Trend: ${values.join(", ")}`);
    }
  }

  // src/js/calendar.js
  var COLORS = ["success", "warning", "danger", "info", "accent"];
  var colorOf = (c) => !c ? "var(--xz-accent-2)" : COLORS.includes(c) ? c === "accent" ? "var(--xz-accent-2)" : `var(--xz-${c})` : /^viz-\d$/.test(c) ? `var(--xz-${c})` : c;
  function initCalendars(root2, { icon: icon4 = () => "" } = {}) {
    for (const el of $$2("[data-xz-calendar]", root2)) {
      if (ready2(el, "Calendar")) continue;
      setup2(el, icon4);
    }
  }
  function setup2(el, icon4) {
    var _a;
    el.classList.add("xz-calendar-view", "is-ready");
    const id2 = nextId("cal");
    const weekStart = Number((_a = el.getAttribute("data-xz-week-start")) != null ? _a : 1);
    const url = el.getAttribute("data-xz-calendar-url");
    const source2 = el.querySelector(".xz-calendar-view__events");
    const read = (li) => {
      const time2 = li.querySelector("time[datetime]");
      const date2 = li.getAttribute("data-date") || (time2 == null ? void 0 : time2.getAttribute("datetime"));
      const link = li.querySelector("a[href]");
      return { title: (li.querySelector("[data-title]") || link || li).textContent.trim(), date: date2 == null ? void 0 : date2.slice(0, 10), end: (li.getAttribute("data-end") || "").slice(0, 10) || null, time: li.getAttribute("data-time") || "", href: (link == null ? void 0 : link.getAttribute("href")) || "", color: li.getAttribute("data-color") || "" };
    };
    let events = source2 ? $$2(":scope > li", source2).map(read).filter((e) => e.date) : [];
    const today = /* @__PURE__ */ new Date();
    const start = fromIso(el.getAttribute("data-xz-month") ? `${el.getAttribute("data-xz-month")}-01` : "") || new Date(today.getFullYear(), today.getMonth(), 1);
    const state = { year: start.getFullYear(), month: start.getMonth(), focus: null, selected: null, remote: [] };
    const all = () => [...events, ...state.remote];
    const on = (iso) => all().filter((e) => e.end ? e.date <= iso && iso <= e.end : e.date === iso).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    const label = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${DAYS[d.getDay()]}`;
    const eventHtml = (e) => {
      const name = e.href ? `<a href="${esc2(e.href)}">${esc2(e.title)}</a>` : esc2(e.title);
      return `<li style="--_c:${esc2(colorOf(e.color))}">${e.time ? `<span class="xz-calendar-view__time">${esc2(e.time)}</span>` : ""}${name}</li>`;
    };
    el.insertAdjacentHTML(
      "afterbegin",
      `<div class="xz-calendar-view__head">
      <h3 class="xz-calendar-view__title" id="${id2}-title" aria-live="polite"></h3>
      <div class="xz-calendar-view__nav">
        <button type="button" class="xz-btn xz-btn--sm" data-cal="today">Today</button>
        <button type="button" class="xz-btn xz-btn--ghost xz-btn--icon xz-btn--sm" data-cal="prev" aria-label="Previous month">${icon4("chevron-left", { size: "sm" })}</button>
        <button type="button" class="xz-btn xz-btn--ghost xz-btn--icon xz-btn--sm" data-cal="next" aria-label="Next month">${icon4("chevron-right", { size: "sm" })}</button>
      </div>
    </div>
    <table class="xz-calendar-view__grid" role="grid" aria-labelledby="${id2}-title"></table>
    <div class="xz-calendar-view__agenda"></div>
    <div class="xz-calendar-view__day" aria-live="polite"></div>`
    );
    const title = el.querySelector(".xz-calendar-view__title");
    const grid = el.querySelector(".xz-calendar-view__grid");
    const agenda = el.querySelector(".xz-calendar-view__agenda");
    const dayBox = el.querySelector(".xz-calendar-view__day");
    const draw = () => {
      const days = monthDays(state.year, state.month, weekStart);
      const first = new Date(state.year, state.month, 1);
      const last = new Date(state.year, state.month + 1, 0);
      if (!state.focus || state.focus.getMonth() !== state.month || state.focus.getFullYear() !== state.year) state.focus = state.selected && state.selected.getMonth() === state.month && state.selected.getFullYear() === state.year ? state.selected : today.getMonth() === state.month && today.getFullYear() === state.year ? new Date(today.getFullYear(), today.getMonth(), today.getDate()) : first;
      title.textContent = `${MONTHS[state.month]} ${state.year}`;
      const head = Array.from({ length: 7 }, (_, i) => DAYS[(weekStart + i) % 7]);
      let rows = "";
      for (let w = 0; w < days.length; w += 7) {
        rows += "<tr>";
        for (const d of days.slice(w, w + 7)) {
          const iso = toIso(d);
          const list = on(iso);
          const outside = d.getMonth() !== state.month;
          const isToday = toIso(today) === iso;
          const sel = state.selected && toIso(state.selected) === iso;
          const chips = list.slice(0, 3).map((e) => `<li style="--_c:${esc2(colorOf(e.color))}">${esc2(e.title)}</li>`).join("") + (list.length > 3 ? `<li class="is-more">+${list.length - 3} more</li>` : "");
          rows += `<td role="gridcell" aria-selected="${Boolean(sel)}" class="${outside ? "is-outside" : ""}${isToday ? " is-today" : ""}"><button type="button" class="xz-calendar-view__date" data-date="${iso}" tabindex="${toIso(state.focus) === iso ? 0 : -1}" aria-label="${label(d)}${list.length ? `, ${list.length} event${list.length === 1 ? "" : "s"}` : ""}"${isToday ? ' aria-current="date"' : ""}><span class="xz-calendar-view__num">${d.getDate()}</span></button>${list.length ? `<ul class="xz-calendar-view__chips" aria-hidden="true">${chips}</ul>` : ""}</td>`;
        }
        rows += "</tr>";
      }
      grid.innerHTML = `<thead><tr>${head.map((n) => `<th scope="col" abbr="${n}">${n.slice(0, 3)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody>`;
      let html = "";
      for (let d = first; d <= last; d = addDays(d, 1)) {
        const list = on(toIso(d));
        if (list.length) html += `<h4 class="xz-calendar-view__agenda-day">${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}</h4><ul class="xz-calendar-view__list">${list.map(eventHtml).join("")}</ul>`;
      }
      agenda.innerHTML = html || '<p class="xz-calendar-view__empty">No events this month.</p>';
      showDay();
    };
    const showDay = () => {
      const d = state.selected;
      dayBox.hidden = false;
      if (!d) return dayBox.innerHTML = '<p class="xz-calendar-view__empty">Pick a day to see its events.</p>';
      const list = on(toIso(d));
      dayBox.innerHTML = `<h4 class="xz-calendar-view__agenda-day">${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}</h4>${list.length ? `<ul class="xz-calendar-view__list">${list.map(eventHtml).join("")}</ul>` : '<p class="xz-calendar-view__empty">No events on this day.</p>'}`;
    };
    const load = async () => {
      const from = toIso(monthDays(state.year, state.month, weekStart)[0]);
      const days = monthDays(state.year, state.month, weekStart);
      const to = toIso(days[days.length - 1]);
      fire2(el, "xz:month", { month: `${state.year}-${String(state.month + 1).padStart(2, "0")}`, start: from, end: to });
      if (!url) return;
      try {
        const res = await fetch(url.replace("{start}", from).replace("{end}", to), { headers: { Accept: "application/json" } });
        const data = res.ok ? await res.json() : [];
        state.remote = (Array.isArray(data) ? data : []).map((e) => ({ title: String(e.title || ""), date: String(e.date || "").slice(0, 10), end: e.end ? String(e.end).slice(0, 10) : null, time: e.time || "", href: e.href || "", color: e.color || "" }));
        draw();
      } catch {
      }
    };
    const go = (year, month) => {
      const d = new Date(year, month, 1);
      state.year = d.getFullYear();
      state.month = d.getMonth();
      state.focus = null;
      draw();
      load();
    };
    const select = (d) => {
      var _a2;
      const iso = toIso(d);
      if (!fire2(el, "xz:day", { date: iso, events: on(iso) }, true)) return;
      state.selected = d;
      for (const td of grid.querySelectorAll("td")) td.setAttribute("aria-selected", String(((_a2 = td.querySelector("button")) == null ? void 0 : _a2.dataset.date) === iso));
      showDay();
    };
    const focusDay = (d) => {
      var _a2;
      if (d.getMonth() !== state.month || d.getFullYear() !== state.year) {
        state.year = d.getFullYear();
        state.month = d.getMonth();
        state.focus = d;
        draw();
        load();
      } else state.focus = d;
      for (const b of grid.querySelectorAll("button")) b.tabIndex = b.dataset.date === toIso(d) ? 0 : -1;
      (_a2 = grid.querySelector(`button[data-date="${toIso(d)}"]`)) == null ? void 0 : _a2.focus();
    };
    el.addEventListener("click", (e) => {
      var _a2;
      const nav = (_a2 = e.target.closest("[data-cal]")) == null ? void 0 : _a2.dataset.cal;
      if (nav === "prev") return go(state.year, state.month - 1);
      if (nav === "next") return go(state.year, state.month + 1);
      if (nav === "today") {
        go(today.getFullYear(), today.getMonth());
        return select(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
      }
      const day = e.target.closest(".xz-calendar-view__date");
      if (day) {
        const d = fromIso(day.dataset.date);
        if (d.getMonth() !== state.month) focusDay(d);
        select(d);
      }
    });
    grid.addEventListener("keydown", (e) => {
      const b = e.target.closest(".xz-calendar-view__date");
      if (!b) return;
      const d = fromIso(b.dataset.date);
      const dir = dirKey(e, el);
      const week = (d.getDay() - weekStart + 7) % 7;
      const next = dir === "next" ? addDays(d, 1) : dir === "prev" ? addDays(d, -1) : { ArrowDown: addDays(d, 7), ArrowUp: addDays(d, -7), Home: addDays(d, -week), End: addDays(d, 6 - week), PageDown: new Date(d.getFullYear(), d.getMonth() + 1, Math.min(d.getDate(), 28)), PageUp: new Date(d.getFullYear(), d.getMonth() - 1, Math.min(d.getDate(), 28)) }[e.key];
      if (!next) return;
      e.preventDefault();
      focusDay(next);
    });
    el.xzCalendar = {
      go: (month) => {
        const d = month instanceof Date ? month : fromIso(`${month}-01`);
        if (d) go(d.getFullYear(), d.getMonth());
      },
      select: (date2) => {
        const d = date2 instanceof Date ? date2 : fromIso(date2);
        if (d) {
          focusDay(d);
          select(d);
        }
      },
      setEvents: (list) => {
        events = (list || []).map((e) => ({ title: String(e.title || ""), date: String(e.date || "").slice(0, 10), end: e.end ? String(e.end).slice(0, 10) : null, time: e.time || "", href: e.href || "", color: e.color || "" }));
        draw();
      },
      month: () => `${state.year}-${String(state.month + 1).padStart(2, "0")}`
    };
    draw();
    load();
  }

  // src/js/hovercard.js
  function initHovercards(root2) {
    for (const wrap of $$2("[data-xz-hovercard]", root2)) {
      if (ready2(wrap, "Hovercard")) continue;
      const trigger = wrap.querySelector(":scope > a, :scope > button, :scope > [data-xz-hovercard-trigger]");
      if (!trigger) continue;
      bindGlobal2();
      wrap.classList.add("xz-hovercard");
      let panel = wrap.querySelector(":scope > .xz-hovercard__panel");
      const from = wrap.getAttribute("data-xz-hovercard");
      if (!panel && from) {
        const tpl = document.querySelector(from);
        if (tpl == null ? void 0 : tpl.content) {
          panel = document.createElement("div");
          panel.className = "xz-hovercard__panel";
          panel.append(tpl.content.cloneNode(true));
          for (const el of $$2("[data-xz-field]", panel)) {
            const v = wrap.dataset[el.getAttribute("data-xz-field")];
            if (v != null) el.textContent = v;
          }
          wrap.append(panel);
        }
      }
      if (!panel) continue;
      panel.classList.add("xz-popover__panel");
      panel.id || (panel.id = nextId("hovercard"));
      panel.hidden = true;
      if (wrap.hasAttribute("data-xz-hovercard-describe")) trigger.setAttribute("aria-describedby", panel.id);
      const openDelay = Number(wrap.getAttribute("data-xz-delay") || 500);
      const closeDelay = Number(wrap.getAttribute("data-xz-close-delay") || 300);
      let timer = 0;
      const close = () => {
        clearTimeout(timer);
        if (panel.hidden) return;
        panel.hidden = true;
        wrap.classList.remove("is-open");
        releaseFloating(panel);
        fire2(wrap, "xz:close");
      };
      const open = () => {
        clearTimeout(timer);
        if (!panel.hidden) return;
        openFloating({ panel, trigger, close: () => close() });
        panel.hidden = false;
        wrap.classList.add("is-open");
        place(panel, trigger, { gap: 8 });
        fire2(wrap, "xz:open");
      };
      const later = (fn, ms) => {
        clearTimeout(timer);
        timer = setTimeout(fn, ms);
      };
      const enter = (e) => e.pointerType !== "touch" && (panel.hidden ? later(open, openDelay) : clearTimeout(timer));
      const leave = (e) => e.pointerType !== "touch" && later(close, closeDelay);
      trigger.addEventListener("pointerenter", enter);
      trigger.addEventListener("pointerleave", leave);
      panel.addEventListener("pointerenter", () => clearTimeout(timer));
      panel.addEventListener("pointerleave", leave);
      trigger.addEventListener("focus", () => trigger.matches(":focus-visible") && open());
      wrap.addEventListener("focusout", (e) => {
        if (!wrap.contains(e.relatedTarget)) later(close, 0);
      });
      wrap.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !panel.hidden) {
          e.stopPropagation();
          close();
        }
      });
      wrap.xzPopover = { open, close };
    }
  }

  // src/js/tree.js
  function initTrees(root2, { icon: icon4 = () => "" } = {}) {
    for (const tree of $$2("ul[data-xz-tree]", root2)) {
      if (ready2(tree, "Tree")) continue;
      setup3(tree, icon4);
    }
  }
  function setup3(tree, icon4) {
    const name = tree.getAttribute("data-xz-tree");
    const key = name ? `xz-tree:${name}` : "";
    const saved = new Set(key ? store.get(key, []) : []);
    tree.classList.add("xz-tree");
    tree.setAttribute("role", "tree");
    const items = [];
    const walk = (ul, level, parent) => {
      for (const li of ul.children) {
        if (li.tagName !== "LI") continue;
        li.setAttribute("role", "none");
        let label = li.firstElementChild;
        if (!label || label.tagName === "UL") {
          label = document.createElement("span");
          li.prepend(label);
        }
        const group = li.querySelector(":scope > ul");
        const item = { li, label, group, parent, level, path: parent ? `${parent.path}/${label.textContent.trim()}` : label.textContent.trim() };
        items.push(item);
        label.setAttribute("role", "treeitem");
        label.setAttribute("aria-level", String(level));
        label.tabIndex = -1;
        label.insertAdjacentHTML("afterbegin", `<span class="xz-tree__toggle${group ? "" : " xz-tree__toggle--leaf"}" aria-hidden="true">${group ? icon4("chevron-right", { size: "xs" }) : ""}</span>`);
        if (group) {
          group.id || (group.id = nextId("tree"));
          group.setAttribute("role", "group");
          label.setAttribute("aria-owns", group.id);
          walk(group, level + 1, item);
        }
      }
    };
    walk(tree, 1, null);
    const byLabel = new Map(items.map((it) => [it.label, it]));
    const isOpen = (it) => it.label.getAttribute("aria-expanded") === "true";
    const setOpen = (it, open, quiet) => {
      if (!it.group) return;
      it.label.setAttribute("aria-expanded", String(open));
      it.group.hidden = !open;
      if (open) saved.add(it.path);
      else saved.delete(it.path);
      if (key) store.set(key, [...saved]);
      if (!quiet) fire2(tree, "xz:toggle", { item: it.label, open });
    };
    for (const it of items) if (it.group) setOpen(it, saved.has(it.path) || it.li.hasAttribute("data-open"), true);
    const current2 = items.find((it) => it.label.getAttribute("aria-current") === "page" || it.label.getAttribute("aria-selected") === "true");
    for (let p = current2 == null ? void 0 : current2.parent; p; p = p.parent) setOpen(p, true, true);
    const visible = () => items.filter((it) => !it.label.closest('[role="group"][hidden]'));
    let active = current2 || items[0];
    const focus = (it) => {
      if (!it) return;
      if (active) active.label.tabIndex = -1;
      active = it;
      it.label.tabIndex = 0;
      it.label.focus();
    };
    if (active) active.label.tabIndex = 0;
    const activate = (it, e) => {
      if (it.group && it.label.tagName !== "A") setOpen(it, !isOpen(it));
      if (!fire2(tree, "xz:select", { item: it.label, label: it.label.textContent.trim() }, true)) e == null ? void 0 : e.preventDefault();
    };
    tree.addEventListener("click", (e) => {
      const label = e.target.closest('[role="treeitem"]');
      const it = label && byLabel.get(label);
      if (!it) return;
      if (e.target.closest(".xz-tree__toggle") && it.group) {
        e.preventDefault();
        setOpen(it, !isOpen(it));
      } else activate(it, e);
      focus(it);
    });
    tree.addEventListener("keydown", (e) => {
      const it = byLabel.get(e.target.closest('[role="treeitem"]'));
      if (!it) return;
      const list = visible();
      const i = list.indexOf(it);
      const dir = dirKey(e, tree);
      let handled = true;
      if (e.key === "ArrowDown") focus(list[i + 1]);
      else if (e.key === "ArrowUp") focus(list[i - 1]);
      else if (e.key === "Home") focus(list[0]);
      else if (e.key === "End") focus(list[list.length - 1]);
      else if (dir === "next") {
        if (it.group && !isOpen(it)) setOpen(it, true);
        else if (it.group) focus(items.find((x) => x.parent === it));
      } else if (dir === "prev") {
        if (it.group && isOpen(it)) setOpen(it, false);
        else focus(it.parent);
      } else if (e.key === "Enter" || e.key === " ") {
        if (it.label.tagName === "A" && e.key === "Enter") return;
        activate(it, e);
      } else if (e.key === "*") {
        for (const x of items) if (x.parent === it.parent && x.group) setOpen(x, true);
      } else if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const ch = e.key.toLowerCase();
        const after = [...list.slice(i + 1), ...list.slice(0, i + 1)];
        focus(after.find((x) => x.label.textContent.trim().toLowerCase().startsWith(ch)));
      } else handled = false;
      if (handled) e.preventDefault();
    });
    tree.xzTree = {
      open: (label) => byLabel.get(label) && setOpen(byLabel.get(label), true),
      close: (label) => byLabel.get(label) && setOpen(byLabel.get(label), false),
      expandAll: () => items.forEach((it) => setOpen(it, true, true)),
      collapseAll: () => items.forEach((it) => setOpen(it, false, true))
    };
  }

  // src/js/layout.js
  var H = {};
  function initScrollAreas(root2) {
    for (const el of $$2(".xz-scroll, [data-xz-scroll]", root2)) {
      if (ready2(el, "Scroll")) continue;
      el.classList.add("xz-scroll");
      if (el.hasAttribute("aria-label") && !el.hasAttribute("role")) el.setAttribute("role", "region");
      const across = () => el.classList.contains("xz-scroll--x");
      const update2 = () => {
        const x = across();
        const at = x ? Math.abs(el.scrollLeft) : el.scrollTop;
        const end = x ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;
        el.classList.toggle("has-before", end > 1 && at > 1);
        el.classList.toggle("has-after", end > 1 && at < end - 1);
        if (end > 1 && !el.hasAttribute("tabindex")) el.tabIndex = 0;
      };
      el.addEventListener("scroll", update2, { passive: true });
      if (typeof ResizeObserver === "function") {
        const ro = new ResizeObserver(update2);
        ro.observe(el);
        for (const child of el.children) ro.observe(child);
      }
      update2();
    }
  }
  var target = (btn) => {
    const sel = btn.getAttribute("data-xz-sidebar-toggle");
    return sel && document.querySelector(sel) || btn.closest(".xz-sidebar") || document.querySelector(".xz-shell > .xz-sidebar");
  };
  function setSidebar(bar, rail, save) {
    bar.classList.toggle("xz-sidebar--rail", rail);
    for (const btn of $$2("[data-xz-sidebar-toggle]")) {
      if (target(btn) !== bar) continue;
      btn.setAttribute("aria-expanded", String(!rail));
      btn.setAttribute("aria-label", rail ? "Expand the menu" : "Collapse the menu");
      if (btn.hasAttribute("data-xz-tooltip")) btn.setAttribute("data-xz-tooltip", rail ? "Expand the menu" : "Collapse the menu");
    }
    for (const link of $$2(".xz-sidebar__link", bar)) {
      if (rail && !link.hasAttribute("data-xz-tooltip")) {
        link.setAttribute("data-xz-tooltip", link.textContent.trim());
        link.setAttribute("data-xz-tooltip-place", "end");
        link.setAttribute("data-xz-tip-auto", "");
      } else if (!rail && link.hasAttribute("data-xz-tip-auto")) {
        for (const a of ["data-xz-tooltip", "data-xz-tooltip-place", "data-xz-tip-auto"]) link.removeAttribute(a);
      }
    }
    const name = bar.getAttribute("data-xz-sidebar");
    if (save && name) store.set(`xz-sidebar:${name}`, rail ? "rail" : "full");
    if (save) fire2(bar, "xz:sidebar", { collapsed: rail });
  }
  function initSidebars(root2) {
    for (const btn of $$2("[data-xz-sidebar-toggle]", root2)) {
      if (ready2(btn, "Sidebar")) continue;
      const bar = target(btn);
      if (!bar) continue;
      btn.setAttribute("aria-controls", bar.id || (bar.id = nextId("sidebar")));
      const name = bar.getAttribute("data-xz-sidebar");
      const saved = name ? store.get(`xz-sidebar:${name}`) : null;
      setSidebar(bar, saved ? saved === "rail" : bar.classList.contains("xz-sidebar--rail"), false);
      btn.addEventListener("click", () => setSidebar(bar, !bar.classList.contains("xz-sidebar--rail"), true));
      if (ready2(bar, "SidebarGroups")) continue;
      bar.addEventListener("click", (e) => {
        const summary = e.target.closest(".xz-sidebar__group > summary");
        if (!summary || !bar.classList.contains("xz-sidebar--rail")) return;
        e.preventDefault();
        setSidebar(bar, false, true);
        summary.parentElement.open = true;
      });
    }
  }
  function confirm(options = {}) {
    const o = typeof options === "string" ? { message: options } : options;
    const back = document.activeElement;
    return new Promise((resolve) => {
      var _a;
      const dlg = document.createElement("dialog");
      const titleId = nextId("confirm");
      dlg.className = "xz-modal xz-modal--sm xz-modal--alert";
      dlg.setAttribute("role", "alertdialog");
      dlg.setAttribute("data-xz-static", "");
      dlg.setAttribute("aria-labelledby", titleId);
      dlg.setAttribute("aria-describedby", `${titleId}-text`);
      const icon4 = o.danger ? ((_a = H.icon) == null ? void 0 : _a.call(H, "triangle-alert")) || "" : "";
      dlg.innerHTML = `<div class="xz-modal__body">${icon4 ? `<span class="xz-modal__icon">${icon4}</span>` : ""}<h2 class="xz-modal__title" id="${titleId}">${esc2(o.title || "Are you sure?")}</h2><p id="${titleId}-text">${esc2(o.message || "")}</p></div><div class="xz-modal__footer"><button class="xz-btn" type="button" value="">${esc2(o.cancel || "Cancel")}</button><button class="xz-btn ${o.danger ? "xz-btn--danger" : "xz-btn--primary"}" type="button" value="ok">${esc2(o.confirm || "Continue")}</button></div>`;
      const done = (yes) => {
        var _a2;
        dlg.close();
        dlg.remove();
        (_a2 = back == null ? void 0 : back.focus) == null ? void 0 : _a2.call(back);
        resolve(yes);
      };
      dlg.addEventListener("click", (e) => {
        const b = e.target.closest("button[value]");
        if (b) done(b.value === "ok");
      });
      dlg.addEventListener("cancel", (e) => {
        e.preventDefault();
        done(false);
      });
      document.body.append(dlg);
      dlg.showModal();
      dlg.querySelector("button").focus();
    });
  }
  function initLayout(root2, helpers2) {
    H = helpers2 || H;
    initScrollAreas(root2);
    initSidebars(root2);
  }

  // src/blocks/shared.js
  function srText(text) {
    return Object.assign(document.createElement("span"), { className: "xz-sr-only", textContent: text });
  }
  function caret() {
    const c = document.createElement("span");
    c.className = "xz-caret";
    c.setAttribute("aria-hidden", "true");
    return c;
  }

  // src/blocks/motion/motion.js
  var KEY = "xz-motion";
  var root = () => document.documentElement;
  var iconFn = () => "";
  var motion = {
    /** True while animations may run. False when paused here or when the system asks for less motion. */
    enabled: () => motionOn(),
    set(on, { persist = true } = {}) {
      root().setAttribute("data-xz-motion", on ? "on" : "off");
      if (persist) {
        try {
          localStorage.setItem(KEY, on ? "on" : "off");
        } catch {
        }
      }
      syncMotionButtons();
      notifyMotion();
      document.dispatchEvent(new CustomEvent("xz:motion", { detail: { on: motionOn() } }));
    },
    toggle() {
      motion.set(root().getAttribute("data-xz-motion") === "off");
    },
    restore() {
      let saved = null;
      try {
        saved = localStorage.getItem(KEY);
      } catch {
      }
      if (saved === "off") root().setAttribute("data-xz-motion", "off");
    }
  };
  function syncMotionButtons() {
    const off = root().getAttribute("data-xz-motion") === "off";
    for (const btn of $$2("[data-xz-motion-toggle]")) {
      btn.classList.add("xz-motion-toggle");
      btn.setAttribute("aria-pressed", String(off));
      if (!btn.hasAttribute("aria-label") && !btn.textContent.trim()) btn.setAttribute("aria-label", "Pause animations");
      const old = btn.querySelector("svg.xz-icon, [data-xz-icon]");
      if (old) old.outerHTML = iconFn(off ? "play" : "pause", { size: old.getAttribute("data-size") || (old.classList.contains("xz-icon--sm") ? "sm" : void 0) });
    }
  }
  function initMotion(root2, { icon: icon4 }) {
    iconFn = icon4;
    syncMotionButtons();
  }

  // src/blocks/motion/reveal.js
  var io = null;
  var waiting = /* @__PURE__ */ new Set();
  function show(el) {
    waiting.delete(el);
    io == null ? void 0 : io.unobserve(el);
    el.classList.remove("is-pending");
    if (!motionOn()) return fire2(el, "xz:reveal");
    el.classList.add("is-revealing");
    el.addEventListener(
      "animationend",
      () => {
        el.classList.remove("is-revealing");
        fire2(el, "xz:reveal");
      },
      { once: true }
    );
  }
  function initReveal(root2) {
    for (const group of $$2("[data-xz-stagger]", root2)) {
      const step = group.getAttribute("data-xz-stagger");
      $$2("[data-xz-reveal]", group).filter((el) => el.closest("[data-xz-stagger]") === group).forEach((el, i) => {
        if (!el.style.getPropertyValue("--xz-i")) el.style.setProperty("--xz-i", String(i));
        if (step) el.style.setProperty("--xz-stagger", `${parseInt(step, 10) || 80}ms`);
      });
    }
    const items = $$2("[data-xz-reveal]", root2).filter((el) => el.getAttribute("data-xz-reveal") !== "load" && !ready2(el, "Reveal"));
    if (!items.length || !motionOn() || typeof IntersectionObserver !== "function") return;
    io || (io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && show(e.target)),
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    ));
    for (const el of items) {
      el.classList.add("is-pending");
      waiting.add(el);
      io.observe(el);
    }
  }
  onMotion((on) => {
    if (!on) [...waiting].forEach(show);
  });

  // src/blocks/motion/rotator.js
  var listFormat = (words) => {
    try {
      return new Intl.ListFormat(document.documentElement.lang || "en", { type: "disjunction" }).format(words);
    } catch {
      return words.join(", ");
    }
  };
  function initRotators(root2) {
    var _a;
    for (const rot of $$2("[data-xz-rotator]", root2)) {
      if (ready2(rot, "Rotator")) continue;
      const items = $$2(":scope > .xz-rotator__item", rot);
      if (items.length < 2) continue;
      const words = items.map((el) => el.textContent.trim());
      const win = document.createElement("span");
      win.className = "xz-rotator__window";
      win.setAttribute("aria-hidden", "true");
      const track = document.createElement("span");
      track.className = "xz-rotator__track";
      const loop = items[0].cloneNode(true);
      track.append(...items, loop);
      win.append(track);
      rot.prepend(srText(listFormat(words)), win);
      if (rot.hasAttribute("data-caret") && !rot.querySelector(".xz-caret")) rot.append(caret());
      rot.classList.add("is-ready");
      const all = [...items, loop];
      const interval = Math.max(1200, parseInt(rot.getAttribute("data-interval"), 10) || 2600);
      let index = 0;
      let timer = 0;
      let visible = true;
      let hover = false;
      let paused = false;
      const place2 = (instant) => {
        const el = all[index];
        if (instant) rot.classList.add("is-jumping");
        all.forEach((item, i) => item.classList.toggle("is-current", i === index || index === words.length && i === 0));
        win.style.width = el.offsetWidth ? `${el.offsetWidth}px` : "";
        track.style.transform = `translateY(${-el.offsetTop}px)`;
        if (instant) {
          void track.offsetWidth;
          rot.classList.remove("is-jumping");
        }
      };
      const settle = () => {
        if (index !== words.length) return;
        index = 0;
        place2(true);
      };
      track.addEventListener("transitionend", (e) => e.target === track && e.propertyName === "transform" && settle());
      const show2 = (i) => {
        settle();
        index = Math.min(i, words.length);
        place2(false);
        const n = index % words.length;
        fire2(rot, "xz:rotate", { index: n, word: words[n] });
      };
      const next = () => {
        settle();
        show2(index + 1);
      };
      const stop = () => {
        clearInterval(timer);
        timer = 0;
      };
      const start = () => {
        stop();
        if (motionOn() && visible && !hover && !paused && !document.hidden) timer = setInterval(next, interval);
      };
      rot.addEventListener("pointerenter", () => (hover = true, stop()));
      rot.addEventListener("pointerleave", () => (hover = false, start()));
      document.addEventListener("visibilitychange", start);
      watch(rot, (v) => {
        visible = v;
        if (v) place2(true);
        start();
      });
      onMotion((on) => {
        if (on) return start();
        stop();
        index = 0;
        place2(true);
      });
      const refit = perFrame(() => place2(true));
      addEventListener("resize", refit);
      (_a = document.fonts) == null ? void 0 : _a.ready.then(refit);
      place2(true);
      rot.xzRotator = {
        next,
        go: (i) => show2((i % words.length + words.length) % words.length),
        pause: () => (paused = true, stop()),
        play: () => (paused = false, start())
      };
    }
  }

  // src/blocks/motion/typewriter.js
  function textNodes(el) {
    const out = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) out.push(walker.currentNode);
    return out;
  }
  function initTypewriters(root2) {
    for (const el of $$2("[data-xz-typewriter]", root2)) {
      if (ready2(el, "Type") || !motionOn()) continue;
      const speed = Math.max(10, parseInt(el.getAttribute("data-speed"), 10) || 40);
      const keepCaret = el.getAttribute("data-caret") === "keep";
      const visual = document.createElement("span");
      visual.setAttribute("aria-hidden", "true");
      visual.append(...el.childNodes);
      el.append(srText(visual.textContent.replace(/\s+/g, " ").trim()), visual);
      const nodes = textNodes(visual);
      const texts = nodes.map((n) => n.data);
      nodes.forEach((n) => n.data = "");
      const cursor = caret();
      visual.append(cursor);
      let timer = 0;
      let started2 = false;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        started2 = true;
        clearTimeout(timer);
        nodes.forEach((n, i) => n.data = texts[i]);
        if (!keepCaret) cursor.remove();
        el.classList.add("is-typed");
        fire2(el, "xz:typed");
      };
      const play = () => {
        if (started2) return;
        started2 = true;
        if (!motionOn()) return finish();
        let n = 0;
        let c = 0;
        const tick = () => {
          while (n < nodes.length && c >= texts[n].length) {
            n += 1;
            c = 0;
          }
          if (n >= nodes.length) return finish();
          c += 1;
          nodes[n].data = texts[n].slice(0, c);
          timer = setTimeout(tick, speed);
        };
        timer = setTimeout(tick, 200);
      };
      if (el.getAttribute("data-xz-typewriter") === "load") play();
      else {
        let io2 = null;
        io2 = watch(el, (v) => v && (io2 == null ? void 0 : io2.disconnect(), play()), { threshold: 0.5 });
      }
      onMotion((on) => !on && finish());
      el.xzTypewriter = { play, finish };
    }
  }

  // src/blocks/motion/sequence.js
  function initSequences(root2) {
    for (const seq of $$2("[data-xz-sequence]", root2)) {
      if (ready2(seq, "Sequence")) continue;
      const steps = $$2("[data-xz-step]", seq).filter((s) => s.closest("[data-xz-sequence]") === seq);
      steps.forEach((s, i) => s.style.setProperty("--xz-i", String(i)));
      const gap = parseInt(seq.getAttribute("data-xz-sequence"), 10) || 160;
      const hold = seq.hasAttribute("data-xz-loop") ? parseInt(seq.getAttribute("data-xz-loop"), 10) || 4e3 : 0;
      let timers = [];
      let visible = false;
      let played = false;
      const clear = () => {
        timers.forEach(clearTimeout);
        timers = [];
      };
      const later = (fn, ms) => timers.push(setTimeout(fn, ms));
      const finish = () => {
        clear();
        seq.classList.remove("is-armed");
        steps.forEach((s) => s.classList.add("is-in"));
        seq.classList.add("is-done");
      };
      const arm = () => {
        clear();
        seq.classList.remove("is-done");
        steps.forEach((s) => s.classList.remove("is-in"));
        seq.classList.add("is-armed");
      };
      const play = () => {
        if (!motionOn()) return finish();
        arm();
        played = true;
        let t = 240;
        steps.forEach((s, i) => {
          t += parseInt(s.getAttribute("data-xz-step"), 10) || 0;
          later(() => {
            s.classList.add("is-in");
            fire2(seq, "xz:sequence", { index: i, done: false });
          }, t);
          t += gap;
        });
        later(() => {
          seq.classList.add("is-done");
          fire2(seq, "xz:sequence", { index: steps.length - 1, done: true });
          if (hold) later(() => visible && play(), hold);
        }, t + 200);
      };
      if (motionOn()) arm();
      else finish();
      watch(
        seq,
        (v) => {
          visible = v;
          if (v && (!played || hold) && !timers.length) play();
          if (!v && hold && motionOn()) arm();
        },
        { threshold: 0.35 }
      );
      onMotion((on) => on ? visible && play() : finish());
      seq.xzSequence = { play, finish };
    }
  }

  // src/blocks/motion/dotfield.js
  function initDotfields(root2) {
    for (const field of $$2(".xz-dotfield", root2)) {
      if (ready2(field, "Dots")) continue;
      field.setAttribute("aria-hidden", "true");
      const host = field.parentElement;
      if (!host) continue;
      let frame = 0;
      let x = 0;
      let y = 0;
      const paint = () => {
        frame = 0;
        field.style.setProperty("--xz-x", `${x}px`);
        field.style.setProperty("--xz-y", `${y}px`);
      };
      host.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch" || !finePointer() || !motionOn()) return;
        const r = field.getBoundingClientRect();
        x = e.clientX - r.left;
        y = e.clientY - r.top;
        field.classList.add("is-lit");
        if (!frame) frame = requestAnimationFrame(paint);
      });
      host.addEventListener("pointerleave", () => field.classList.remove("is-lit"));
    }
  }

  // src/blocks/motion/layers.js
  function initLayers(root2) {
    for (const box2 of $$2("[data-xz-layers]", root2)) {
      if (ready2(box2, "Layers")) continue;
      const count = clamp(parseInt(box2.getAttribute("data-xz-layers"), 10) || 5, 2, 12);
      const face = box2.querySelector(".xz-layers__face");
      const stack = document.createElement("div");
      stack.className = "xz-layers__stack";
      for (let i = 0; i < count; i++) {
        const plate = document.createElement("span");
        plate.className = "xz-layers__plate";
        plate.style.setProperty("--i", String(i));
        stack.append(plate);
      }
      if (face) stack.lastElementChild.append(face);
      box2.append(stack);
      box2.style.setProperty("--xz-layers-count", String(count));
      if (box2.hasAttribute("aria-label")) box2.setAttribute("role", "img");
      else box2.setAttribute("aria-hidden", "true");
      const area = box2.closest("[data-xz-tilt-area]") || box2.closest("section") || box2;
      let frame = 0;
      let tx = 0;
      let ty = 0;
      const paint = () => {
        frame = 0;
        stack.style.setProperty("--xz-tilt-x", `${tx}deg`);
        stack.style.setProperty("--xz-tilt-y", `${ty}deg`);
      };
      area.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch" || !finePointer() || !motionOn()) return;
        const r = box2.getBoundingClientRect();
        tx = clamp((e.clientY - (r.top + r.height / 2)) / innerHeight * 2, -1, 1) * -8;
        ty = clamp((e.clientX - (r.left + r.width / 2)) / innerWidth * 2, -1, 1) * 10;
        if (!frame) frame = requestAnimationFrame(paint);
      });
      area.addEventListener("pointerleave", () => {
        tx = 0;
        ty = 0;
        if (!frame) frame = requestAnimationFrame(paint);
      });
    }
  }

  // src/blocks/motion/depth.js
  function initDepth(root2) {
    var _a;
    for (const box2 of $$2("[data-xz-depth]", root2)) {
      if (ready2(box2, "Depth")) continue;
      const media = matchMedia("(min-width: 1024px) and (pointer: fine)");
      const strength = clamp(parseFloat(box2.getAttribute("data-xz-depth")) || 1, 0.2, 2);
      const items = () => {
        const marked = $$2("[data-xz-depth-item]", box2);
        return marked.length ? marked : Array.from(box2.children);
      };
      let list = [];
      let active = false;
      const clear = () => items().forEach((el) => {
        el.style.transform = "";
        el.style.opacity = "";
      });
      const measure = () => {
        clear();
        list = items().map((el) => {
          const r = el.getBoundingClientRect();
          return { el, mid: r.top + scrollY + r.height / 2 };
        });
      };
      const update2 = () => {
        if (!active) return;
        const half = innerHeight / 2;
        for (const item of list) {
          const d = (item.mid - scrollY - half) / half;
          if (Math.abs(d) > 1.4) continue;
          const bend = clamp((Math.abs(d) - 0.55) / 0.45) * strength;
          item.el.style.transform = bend ? `perspective(900px) rotateX(${(-Math.sign(d) * bend * 36).toFixed(2)}deg) translateZ(${(-bend * bend * 80).toFixed(1)}px)` : "";
          item.el.style.opacity = bend ? String(1 - Math.min(bend, 1) * 0.6) : "";
        }
      };
      const sync = () => {
        active = media.matches && motionOn();
        box2.classList.toggle("is-depth", active);
        if (!active) return clear();
        measure();
        update2();
      };
      const onScroll = perFrame(update2);
      addEventListener("scroll", onScroll, { passive: true });
      addEventListener("resize", perFrame(sync));
      media.addEventListener("change", sync);
      onMotion(sync);
      (_a = document.fonts) == null ? void 0 : _a.ready.then(sync);
      addEventListener("load", sync, { once: true });
      if (typeof ResizeObserver === "function") new ResizeObserver(perFrame(sync)).observe(document.body);
      sync();
    }
  }

  // src/blocks/motion/curtain.js
  function initCurtains(root2) {
    for (const band of $$2("[data-xz-curtain]", root2)) {
      if (ready2(band, "Curtain")) continue;
      const update2 = () => {
        if (!motionOn()) return band.style.setProperty("--xz-curtain", "1");
        const top = band.getBoundingClientRect().top;
        const t = clamp((innerHeight - top) / (innerHeight * 0.6));
        band.style.setProperty("--xz-curtain", (1 - (1 - t) * (1 - t)).toFixed(3));
      };
      const onScroll = perFrame(update2);
      addEventListener("scroll", onScroll, { passive: true });
      addEventListener("resize", onScroll);
      onMotion(update2);
      update2();
    }
  }

  // src/blocks/navigation/navbar.js
  function initNavbars(root2) {
    for (const nav of $$2("[data-xz-navbar]", root2)) {
      if (ready2(nav, "Navbar")) continue;
      const adapt = nav.getAttribute("data-xz-navbar") === "adapt";
      const update2 = () => {
        nav.classList.toggle("is-scrolled", scrollY > 8);
        if (!adapt) return;
        const y = nav.getBoundingClientRect().bottom + 1;
        const under = document.elementsFromPoint(innerWidth / 2, Math.min(y, innerHeight - 1)).find((el) => !nav.contains(el));
        const band = under == null ? void 0 : under.closest("[data-theme]:not(html)");
        if (band) nav.setAttribute("data-theme", band.getAttribute("data-theme"));
        else nav.removeAttribute("data-theme");
      };
      const onScroll = perFrame(update2);
      addEventListener("scroll", onScroll, { passive: true });
      addEventListener("resize", onScroll);
      document.addEventListener("xz:theme", onScroll);
      update2();
    }
  }

  // src/blocks/navigation/scroll-progress.js
  var bars = /* @__PURE__ */ new Set();
  var update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    bars.forEach((bar) => bar.style.setProperty("--xz-progress", p.toFixed(4)));
  };
  var bound3 = false;
  function initScrollProgress(root2) {
    for (const bar of $$2("[data-xz-scroll-progress]", root2)) {
      if (ready2(bar, "Progress")) continue;
      bar.classList.add("xz-scroll-progress");
      bar.setAttribute("aria-hidden", "true");
      bars.add(bar);
    }
    if (bars.size && !bound3) {
      bound3 = true;
      const onScroll = perFrame(update);
      addEventListener("scroll", onScroll, { passive: true });
      addEventListener("resize", onScroll);
    }
    update();
  }

  // src/blocks/navigation/tabs-expand.js
  var widths = { md: 768, lg: 1024, xl: 1280 };
  function initTabsExpand(root2) {
    for (const tabs of $$2("[data-xz-tabs][data-xz-tabs-expand]", root2)) {
      if (ready2(tabs, "Expand")) continue;
      const at = widths[tabs.getAttribute("data-xz-tabs-expand")] || widths.lg;
      const media = matchMedia(`(min-width: ${at}px)`);
      const tabEls = $$2(":scope > .xz-tabs__list .xz-tabs__tab", tabs);
      const panels = $$2(":scope > .xz-tabs__panel", tabs);
      const sync = () => {
        const wide = media.matches;
        tabs.classList.toggle("is-expanded", wide);
        const selected = Math.max(0, tabEls.findIndex((t) => t.getAttribute("aria-selected") === "true"));
        panels.forEach((p, i) => {
          if (wide) {
            p.hidden = false;
            p.removeAttribute("role");
            p.removeAttribute("tabindex");
            p.removeAttribute("aria-labelledby");
          } else {
            p.setAttribute("role", "tabpanel");
            p.tabIndex = 0;
            if (tabEls[i]) p.setAttribute("aria-labelledby", tabEls[i].id);
            p.hidden = i !== selected;
          }
        });
      };
      media.addEventListener("change", sync);
      sync();
    }
  }

  // src/blocks/content/marquee.js
  function initMarquees(root2) {
    var _a;
    for (const box2 of $$2(".xz-marquee", root2)) {
      if (ready2(box2, "Marquee")) continue;
      const track = box2.querySelector(".xz-marquee__track");
      if (!track || !track.children.length) continue;
      for (const item of Array.from(track.children)) {
        const copy2 = item.cloneNode(true);
        copy2.setAttribute("aria-hidden", "true");
        copy2.setAttribute("data-xz-clone", "");
        for (const el of copy2.querySelectorAll("a, button, input, select, textarea, [tabindex]")) el.tabIndex = -1;
        track.append(copy2);
      }
      const speed = Math.max(5, parseFloat(box2.getAttribute("data-speed")) || 40);
      const size = () => box2.style.setProperty("--xz-marquee-duration", `${(track.scrollWidth / 2 / speed).toFixed(1)}s`);
      size();
      addEventListener("resize", perFrame(size));
      (_a = document.fonts) == null ? void 0 : _a.ready.then(size);
      box2.classList.add("is-ready");
      let held = false;
      let visible = true;
      const sync = () => box2.classList.toggle("is-paused", held || !visible);
      watch(box2, (v) => (visible = v, sync()));
      box2.xzMarquee = { pause: () => (held = true, sync()), play: () => (held = false, sync()) };
    }
  }

  // src/blocks/forms/copy.js
  var live = null;
  function announce(message) {
    if (!live) {
      live = Object.assign(document.createElement("div"), { className: "xz-sr-only" });
      live.setAttribute("role", "status");
      document.body.append(live);
    }
    live.textContent = "";
    setTimeout(() => live.textContent = message, 30);
  }
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = Object.assign(document.createElement("textarea"), { value: text });
      area.setAttribute("readonly", "");
      area.style.cssText = "position:fixed;top:0;left:0;opacity:0";
      document.body.append(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
      }
      area.remove();
      return ok;
    }
  }
  function source(btn) {
    var _a;
    const literal = btn.getAttribute("data-xz-copy");
    if (literal) return { text: literal };
    const target2 = btn.hasAttribute("data-xz-copy-target") ? document.querySelector(btn.getAttribute("data-xz-copy-target")) : (_a = btn.closest(".xz-command")) == null ? void 0 : _a.querySelector(".xz-command__text");
    if (!target2) return { text: "" };
    return { text: "value" in target2 && typeof target2.value === "string" ? target2.value : target2.textContent.trim(), target: target2 };
  }
  function initCopy(root2, { icon: icon4 }) {
    for (const btn of $$2("[data-xz-copy]", root2)) {
      if (ready2(btn, "Copy")) continue;
      const wrap = Object.assign(document.createElement("span"), { className: "xz-copy" });
      const idle = Object.assign(document.createElement("span"), { className: "xz-copy__idle" });
      const done = Object.assign(document.createElement("span"), { className: "xz-copy__done" });
      done.setAttribute("aria-hidden", "true");
      idle.append(...btn.childNodes);
      const iconOnly = btn.classList.contains("xz-btn--icon");
      done.innerHTML = icon4("check", { size: "sm" }) + (iconOnly ? "" : "<span>Copied</span>");
      wrap.append(idle, done);
      btn.append(wrap);
      let timer = 0;
      btn.addEventListener("click", async () => {
        const { text, target: target2 } = source(btn);
        if (!text) return;
        const ok = await copy(text);
        clearTimeout(timer);
        if (ok) {
          btn.classList.add("is-copied");
          announce("Copied");
          timer = setTimeout(() => btn.classList.remove("is-copied"), 2e3);
        } else {
          announce("Could not copy. Select the text and press Ctrl+C.");
          if (target2) getSelection().selectAllChildren(target2);
        }
        fire2(btn, "xz:copy", { text, ok });
      });
    }
  }

  // src/blocks/data-display/flow.js
  var NS = "http://www.w3.org/2000/svg";
  function initFlows(root2) {
    var _a;
    for (const flow of $$2("[data-xz-flow]", root2)) {
      if (ready2(flow, "Flow")) continue;
      const source2 = flow.querySelector(".xz-flow__source");
      const hub = flow.querySelector(".xz-flow__hub");
      const targets = $$2("[data-xz-flow-target]", flow);
      if (!source2 || !hub || !targets.length) continue;
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("class", "xz-flow__lines");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      flow.prepend(svg);
      const anchor = (part) => part.querySelector("[data-xz-flow-anchor]") || part;
      const wideQuery = matchMedia("(min-width: 1024px)");
      const auto = flow.getAttribute("data-xz-flow") === "auto";
      let routes = [];
      let active = -1;
      let holding = false;
      let visible = true;
      let timer = 0;
      const path = (d, cls) => {
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", d);
        p.setAttribute("class", cls);
        p.setAttribute("pathLength", "100");
        svg.append(p);
        return p;
      };
      const paint = () => {
        var _a2;
        for (const p of svg.querySelectorAll(".xz-flow__line")) {
          p.classList.toggle("is-active", active >= 0 && (p.dataset.route === "in" || Number(p.dataset.route) === active));
        }
        (_a2 = svg.querySelector(".xz-flow__pulse")) == null ? void 0 : _a2.remove();
        if (active >= 0 && routes[active]) path(routes[active].full, "xz-flow__pulse");
        targets.forEach((t, i) => {
          t.classList.toggle("is-active", i === active);
          if (t.tagName === "BUTTON") t.setAttribute("aria-pressed", String(i === active));
        });
      };
      const draw = () => {
        const box2 = flow.getBoundingClientRect();
        if (!box2.width) return;
        const wide = wideQuery.matches;
        const rel = (el) => {
          const r = el.getBoundingClientRect();
          return { l: r.left - box2.left, t: r.top - box2.top, w: r.width, h: r.height };
        };
        const curve = (p, q) => wide ? `C${(p.x + q.x) / 2},${p.y} ${(p.x + q.x) / 2},${q.y} ${q.x},${q.y}` : `C${p.x},${(p.y + q.y) / 2} ${q.x},${(p.y + q.y) / 2} ${q.x},${q.y}`;
        let start2;
        let mid;
        let inEnd;
        let outStart;
        if (wide) {
          const s = rel(anchor(source2));
          const h = rel(anchor(hub));
          start2 = { x: s.l + s.w, y: s.t + s.h / 2 };
          mid = { x: h.l + h.w / 2, y: h.t + h.h / 2 };
          inEnd = mid;
          outStart = mid;
        } else {
          const s = rel(source2);
          const h = rel(hub);
          const x = h.l + h.w / 2;
          start2 = { x, y: s.t + s.h };
          inEnd = { x, y: h.t };
          outStart = { x, y: h.t + h.h };
        }
        routes = targets.map((t) => {
          const r = wide ? rel(t) : rel(targets[0].closest(".xz-flow__targets") || t);
          const end = wide ? { x: r.l, y: r.t + r.h / 2 } : { x: outStart.x, y: r.t };
          const through = wide ? "" : ` M${outStart.x},${outStart.y}`;
          return { out: `M${outStart.x},${outStart.y} ${curve(outStart, end)}`, full: `M${start2.x},${start2.y} ${curve(start2, inEnd)}${through} ${curve(outStart, end)}` };
        });
        svg.setAttribute("viewBox", `0 0 ${box2.width} ${box2.height}`);
        svg.replaceChildren();
        path(`M${start2.x},${start2.y} ${curve(start2, inEnd)}`, "xz-flow__line").dataset.route = "in";
        routes.forEach((r, i) => path(r.out, "xz-flow__line").dataset.route = String(i));
        paint();
      };
      const select = (i) => {
        if (i === active) return;
        active = i;
        paint();
        if (i >= 0) fire2(flow, "xz:route", { index: i, target: targets[i] });
      };
      const stop = () => {
        clearInterval(timer);
        timer = 0;
      };
      const start = () => {
        stop();
        if (auto && visible && !holding && motionOn()) timer = setInterval(() => select((active + 1) % targets.length), 2400);
      };
      targets.forEach((t, i) => {
        t.addEventListener("pointerenter", () => (holding = true, stop(), select(i)));
        t.addEventListener("focus", () => (holding = true, stop(), select(i)));
        t.addEventListener("pointerleave", () => {
          if (t.contains(document.activeElement)) return;
          holding = false;
          if (!auto) select(-1);
          start();
        });
        t.addEventListener("blur", () => {
          holding = false;
          if (!auto) select(-1);
          start();
        });
      });
      const redraw = perFrame(draw);
      if (typeof ResizeObserver === "function") new ResizeObserver(redraw).observe(flow);
      addEventListener("resize", redraw);
      (_a = document.fonts) == null ? void 0 : _a.ready.then(redraw);
      watch(flow, (v) => (visible = v, start()));
      onMotion(start);
      draw();
      flow.xzFlow = { redraw: draw, select };
    }
  }

  // src/blocks/index.js
  var bound4 = false;
  function initBlocks(root2, { icon: icon4 }) {
    if (!bound4) {
      bound4 = true;
      motion.restore();
      document.addEventListener("click", (e) => {
        var _a, _b;
        if ((_b = (_a = e.target).closest) == null ? void 0 : _b.call(_a, "[data-xz-motion-toggle]")) motion.toggle();
      });
    }
    initMotion(root2, { icon: icon4 });
    initNavbars(root2);
    initScrollProgress(root2);
    initTabsExpand(root2);
    initMarquees(root2);
    initCopy(root2, { icon: icon4 });
    initLayers(root2);
    initFlows(root2);
    initRotators(root2);
    initTypewriters(root2);
    initSequences(root2);
    initDotfields(root2);
    initDepth(root2);
    initCurtains(root2);
    initReveal(root2);
    syncMotionButtons();
  }

  // src/js/index.js
  var $ = (sel, root2 = document) => root2.querySelector(sel);
  var $$4 = (sel, root2 = document) => Array.from(root2.querySelectorAll(sel));
  var uid4 = 0;
  var id = (prefix) => `xz-${prefix}-${++uid4}`;
  function icon3(name, { size, label } = {}) {
    const body = icons_generated_default[name];
    if (!body) return "";
    const cls = "xz-icon" + (size ? ` xz-icon--${size}` : "");
    const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
    return `<svg class="${cls}" viewBox="0 0 24 24" ${a11y} focusable="false">${body}</svg>`;
  }
  function initIcons(root2) {
    for (const el of $$4("[data-xz-icon]", root2)) {
      const name = el.getAttribute("data-xz-icon");
      const html = icon3(name, { size: el.getAttribute("data-size"), label: el.getAttribute("aria-label") });
      if (!html) {
        console.warn(`[Xsenze] Unknown icon "${name}"`);
        continue;
      }
      const tpl = document.createElement("template");
      tpl.innerHTML = html;
      const svg = tpl.content.firstChild;
      for (const c of el.classList) svg.classList.add(c);
      el.replaceWith(svg);
    }
  }
  var theme = {
    get: () => document.documentElement.getAttribute("data-theme") || "light",
    set(name, { persist = true } = {}) {
      document.documentElement.setAttribute("data-theme", name);
      if (persist) {
        try {
          localStorage.setItem("xz-theme", name);
        } catch {
        }
      }
      theme.sync();
      document.dispatchEvent(new CustomEvent("xz:theme", { detail: { theme: name } }));
    },
    /** Toggle buttons show a sun in the dark theme and a moon in the light theme. */
    sync() {
      const dark = theme.get() === "dark";
      for (const btn of $$4("[data-xz-theme-toggle]")) {
        btn.setAttribute("aria-pressed", String(dark));
        const old = $("svg.xz-icon, [data-xz-icon]", btn);
        if (old) old.outerHTML = icon3(dark ? "sun" : "moon");
      }
    },
    toggle() {
      theme.set(theme.get() === "dark" ? "light" : "dark");
    },
    /** Use the saved theme, else the one in the markup, else the system setting when `data-theme="auto"`. */
    restore() {
      let saved = null;
      try {
        saved = localStorage.getItem("xz-theme");
      } catch {
      }
      const attr = document.documentElement.getAttribute("data-theme");
      if (saved) theme.set(saved, { persist: false });
      else if (attr === "auto") theme.set(matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light", { persist: false });
    }
  };
  function openDialog2(target2) {
    const el = typeof target2 === "string" ? $(target2) : target2;
    if (el && !el.open) el.showModal();
    return el;
  }
  function closeDialog2(target2, value) {
    const el = typeof target2 === "string" ? $(target2) : target2;
    if (el && el.open) el.close(value);
  }
  function toast(options) {
    const o = typeof options === "string" ? { message: options } : options;
    const { title, message, variant, duration = 5e3, action } = o;
    let region = $(".xz-toast-region");
    if (!region) {
      region = document.createElement("div");
      region.className = "xz-toast-region";
      region.setAttribute("role", "region");
      region.setAttribute("aria-label", "Notifications");
      document.body.append(region);
    }
    const el = document.createElement("div");
    el.className = "xz-toast" + (variant ? ` xz-toast--${variant}` : "");
    el.setAttribute("role", variant === "danger" ? "alert" : "status");
    const body = document.createElement("div");
    body.className = "xz-toast__body";
    if (title) body.append(Object.assign(document.createElement("div"), { className: "xz-toast__title", textContent: title }));
    if (message) body.append(Object.assign(document.createElement("div"), { className: "xz-toast__text", textContent: message }));
    el.append(body);
    const dismiss = () => {
      if (!el.isConnected) return;
      el.classList.add("is-leaving");
      setTimeout(() => el.remove(), 200);
    };
    if (action) {
      const btn = Object.assign(document.createElement("button"), { className: "xz-toast__action", type: "button", textContent: action.label });
      btn.addEventListener("click", () => {
        var _a;
        (_a = action.onClick) == null ? void 0 : _a.call(action);
        dismiss();
      });
      el.append(btn);
    }
    const close = Object.assign(document.createElement("button"), { className: "xz-toast__close", type: "button", textContent: "\u2715" });
    close.setAttribute("aria-label", "Dismiss");
    close.addEventListener("click", dismiss);
    el.append(close);
    region.append(el);
    let timer = duration > 0 ? setTimeout(dismiss, duration) : null;
    const hold = () => clearTimeout(timer);
    const resume = () => duration > 0 && (timer = setTimeout(dismiss, duration));
    el.addEventListener("mouseenter", hold);
    el.addEventListener("focusin", hold);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("focusout", resume);
    return { el, dismiss };
  }
  function initTabs(root2) {
    for (const tabs of $$4("[data-xz-tabs]", root2)) {
      if (tabs.xzReady) continue;
      tabs.xzReady = true;
      const list = $(".xz-tabs__list", tabs);
      const tabEls = $$4(".xz-tabs__tab", list);
      const panels = $$4(":scope > .xz-tabs__panel", tabs);
      list.setAttribute("role", "tablist");
      const select = (tab, focus) => {
        tabEls.forEach((t, i) => {
          const on = t === tab;
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
          if (panels[i]) panels[i].hidden = !on;
        });
        if (focus) tab.focus();
        tabs.dispatchEvent(new CustomEvent("xz:tab", { bubbles: true, detail: { index: tabEls.indexOf(tab) } }));
      };
      tabEls.forEach((t, i) => {
        var _a;
        t.setAttribute("role", "tab");
        t.type = "button";
        t.id || (t.id = id("tab"));
        if (panels[i]) {
          (_a = panels[i]).id || (_a.id = id("panel"));
          panels[i].setAttribute("role", "tabpanel");
          panels[i].setAttribute("aria-labelledby", t.id);
          panels[i].tabIndex = 0;
          t.setAttribute("aria-controls", panels[i].id);
        }
        t.addEventListener("click", () => select(t));
      });
      list.addEventListener("keydown", (e) => {
        const enabled = tabEls.filter((t) => !t.disabled);
        const i = enabled.indexOf(document.activeElement);
        const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: enabled.length - 1 }[e.key];
        if (next === void 0 || i < 0) return;
        e.preventDefault();
        select(enabled[(next + enabled.length) % enabled.length], true);
      });
      select(tabEls.find((t) => t.getAttribute("aria-selected") === "true") || tabEls[0]);
    }
  }
  function closeMenus(except) {
    for (const m of $$4("[data-xz-menu].is-open")) {
      if (m === except) continue;
      m.classList.remove("is-open");
      $(".xz-menu__list", m).hidden = true;
      m.xzTrigger.setAttribute("aria-expanded", "false");
    }
  }
  function initMenus(root2) {
    for (const menu of $$4("[data-xz-menu]", root2)) {
      if (menu.xzReady) continue;
      menu.xzReady = true;
      const list = $(".xz-menu__list", menu);
      const trigger = $(":scope > button, :scope > [data-xz-menu-trigger]", menu);
      menu.xzTrigger = trigger;
      list.hidden = true;
      list.id || (list.id = id("menu"));
      list.setAttribute("role", "menu");
      trigger.setAttribute("aria-haspopup", "menu");
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-controls", list.id);
      const items = () => $$4(".xz-menu__item:not(:disabled)", list);
      items().forEach((i) => {
        i.setAttribute("role", "menuitem");
        if (i.parentElement.tagName === "LI") i.parentElement.setAttribute("role", "none");
        i.tabIndex = -1;
      });
      const open = (focusLast) => {
        var _a;
        closeMenus(menu);
        menu.classList.add("is-open");
        list.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        list.classList.add("is-fixed");
        const t = trigger.getBoundingClientRect();
        const l = list.getBoundingClientRect();
        let left = menu.classList.contains("xz-menu--end") ? t.right - l.width : t.left;
        left = Math.min(Math.max(8, left), innerWidth - l.width - 8);
        let top = t.bottom + 4;
        if (top + l.height > innerHeight - 8 && t.top - l.height - 4 > 8) top = t.top - l.height - 4;
        list.style.left = `${left}px`;
        list.style.top = `${top}px`;
        const all = items();
        (_a = focusLast ? all[all.length - 1] : all[0]) == null ? void 0 : _a.focus();
      };
      const close = (refocus) => {
        closeMenus();
        if (refocus) trigger.focus();
      };
      trigger.addEventListener("click", () => menu.classList.contains("is-open") ? close() : open());
      trigger.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          open(e.key === "ArrowUp");
        }
      });
      list.addEventListener("keydown", (e) => {
        const all = items();
        const i = all.indexOf(document.activeElement);
        if (e.key === "Escape") return close(true);
        if (e.key === "Tab") return close();
        const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: all.length - 1 }[e.key];
        if (next === void 0) return;
        e.preventDefault();
        all[(next + all.length) % all.length].focus();
      });
      list.addEventListener("click", (e) => {
        if (e.target.closest(".xz-menu__item")) close(true);
      });
    }
  }
  var tip;
  function showTip(el) {
    const text = el.getAttribute("data-xz-tooltip");
    if (!text) return;
    hideTip();
    tip = document.createElement("div");
    tip.className = "xz-tooltip";
    tip.id = "xz-tooltip";
    tip.setAttribute("role", "tooltip");
    tip.textContent = text;
    document.body.append(tip);
    el.setAttribute("aria-describedby", tip.id);
    tip.xzFor = el;
    const r = el.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const place2 = el.getAttribute("data-xz-tooltip-place") || "top";
    let top = place2 === "bottom" ? r.bottom + 8 : r.top - t.height - 8;
    if (top < 4) top = r.bottom + 8;
    if (top + t.height > innerHeight - 4) top = r.top - t.height - 8;
    let left = Math.min(Math.max(4, r.left + r.width / 2 - t.width / 2), innerWidth - t.width - 4);
    if (place2 === "end") {
      top = r.top + r.height / 2 - t.height / 2;
      left = isRtl(el) ? r.left - t.width - 8 : r.right + 8;
    }
    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
    requestAnimationFrame(() => tip == null ? void 0 : tip.classList.add("is-open"));
  }
  function hideTip() {
    if (!tip) return;
    tip.xzFor.removeAttribute("aria-describedby");
    tip.remove();
    tip = null;
  }
  function initComboboxes(root2) {
    var _a, _b;
    for (const box2 of $$4("[data-xz-combobox]", root2)) {
      if (box2.xzReady) continue;
      const select = $("select", box2);
      if (!select) continue;
      box2.xzReady = true;
      box2.classList.add("xz-combobox");
      const options = $$4("option", select).filter((o) => o.value !== "").map((o) => ({ value: o.value, label: o.textContent.trim() }));
      const placeholder = ((_a = $('option[value=""]', select)) == null ? void 0 : _a.textContent.trim()) || box2.getAttribute("data-placeholder") || "Search";
      const input = document.createElement("input");
      const list = document.createElement("ul");
      list.className = "xz-combobox__list";
      list.id = id("listbox");
      list.setAttribute("role", "listbox");
      list.hidden = true;
      input.className = select.className.replace("xz-select", "xz-input xz-select");
      input.type = "text";
      input.placeholder = placeholder;
      input.autocomplete = "off";
      input.setAttribute("role", "combobox");
      input.setAttribute("aria-autocomplete", "list");
      input.setAttribute("aria-expanded", "false");
      input.setAttribute("aria-controls", list.id);
      if (select.id) {
        input.id = select.id;
        select.removeAttribute("id");
      }
      for (const a of ["aria-describedby", "aria-invalid", "aria-label"]) if (select.hasAttribute(a)) input.setAttribute(a, select.getAttribute(a));
      input.disabled = select.disabled;
      input.value = ((_b = select.selectedOptions[0]) == null ? void 0 : _b.value) ? select.selectedOptions[0].textContent.trim() : "";
      select.hidden = true;
      select.tabIndex = -1;
      box2.append(input, list);
      let active = -1;
      let shown = [];
      const render = (query2) => {
        const q = query2.trim().toLowerCase();
        shown = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
        list.innerHTML = "";
        if (!shown.length) {
          const empty = Object.assign(document.createElement("li"), { className: "xz-combobox__empty", textContent: box2.getAttribute("data-empty") || "No matches. Try a different search." });
          empty.setAttribute("role", "presentation");
          list.append(empty);
        }
        shown.forEach((o, i) => {
          const li = Object.assign(document.createElement("li"), { className: "xz-combobox__option", textContent: o.label, id: `${list.id}-${i}` });
          li.setAttribute("role", "option");
          li.setAttribute("aria-selected", String(o.value === select.value));
          li.addEventListener("mousedown", (e) => {
            e.preventDefault();
            choose(o);
          });
          list.append(li);
        });
        setActive(shown.length ? Math.max(0, shown.findIndex((o) => o.value === select.value)) : -1);
      };
      const setActive = (i) => {
        var _a2;
        active = i;
        $$4(".xz-combobox__option", list).forEach((li, n) => li.classList.toggle("is-active", n === i));
        if (i >= 0) {
          input.setAttribute("aria-activedescendant", `${list.id}-${i}`);
          (_a2 = list.children[i]) == null ? void 0 : _a2.scrollIntoView({ block: "nearest" });
        } else input.removeAttribute("aria-activedescendant");
      };
      const open = (query2 = "") => {
        render(query2);
        list.hidden = false;
        input.setAttribute("aria-expanded", "true");
      };
      const close = () => {
        list.hidden = true;
        input.setAttribute("aria-expanded", "false");
        input.removeAttribute("aria-activedescendant");
      };
      const choose = (o) => {
        select.value = o.value;
        input.value = o.label;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        close();
      };
      input.addEventListener("focus", () => input.select());
      input.addEventListener("click", () => list.hidden ? open() : close());
      input.addEventListener("input", () => open(input.value));
      input.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          if (list.hidden) return open();
          if (shown.length) setActive((active + (e.key === "ArrowDown" ? 1 : -1) + shown.length) % shown.length);
        } else if (e.key === "Enter" && !list.hidden) {
          e.preventDefault();
          if (shown[active]) choose(shown[active]);
        } else if (e.key === "Escape" && !list.hidden) {
          e.preventDefault();
          close();
        }
      });
      input.addEventListener("blur", () => {
        close();
        const current2 = options.find((o) => o.value === select.value);
        if (!input.value.trim()) {
          select.value = "";
          select.dispatchEvent(new Event("change", { bubbles: true }));
        } else input.value = current2 ? current2.label : "";
      });
    }
  }
  var messages = {
    valueMissing: (f) => `Enter ${fieldName(f)}`,
    typeMismatch: (f) => f.type === "email" ? "Enter an email address like name@example.com" : f.type === "url" ? "Enter a full web address starting with https://" : "Check the format",
    tooShort: (f) => `Use at least ${f.minLength} characters`,
    tooLong: (f) => `Use ${f.maxLength} characters or fewer`,
    patternMismatch: (f) => f.title || "Check the format",
    rangeUnderflow: (f) => `Enter ${f.min} or more`,
    rangeOverflow: (f) => `Enter ${f.max} or less`,
    stepMismatch: () => "Enter a valid number",
    badInput: () => "Enter a valid value"
  };
  function fieldName(f) {
    var _a, _b;
    const label = (_b = (_a = f.labels) == null ? void 0 : _a[0]) == null ? void 0 : _b.textContent.replace(/[*]|\(optional\)/gi, "").trim();
    const personal = ["email", "password", "tel"].includes(f.type) || f.autocomplete && f.autocomplete !== "off";
    return label ? `${personal ? "your" : "the"} ${label.toLowerCase()}` : "a value";
  }
  function fieldMessage(f) {
    const v = f.validity;
    if (v.valid) return "";
    for (const key of Object.keys(messages)) {
      if (!v[key]) continue;
      const custom = f.getAttribute(`data-xz-msg-${key.toLowerCase()}`) || f.getAttribute("data-xz-msg");
      if (custom) return custom;
      if (key === "valueMissing" && f.type === "checkbox") return "Tick this box to continue";
      if (key === "valueMissing" && f.tagName === "SELECT") return `Select ${fieldName(f).replace(/^(your|the) /, "a ")}`;
      return messages[key](f);
    }
    return f.validationMessage;
  }
  function validateField2(f) {
    var _a;
    const msg = fieldMessage(f);
    const field = f.closest(".xz-field") || ((_a = f.closest("label")) == null ? void 0 : _a.parentElement) || f.parentElement;
    let err = field.querySelector(".xz-error");
    const shown = f.hidden ? field.querySelector('[role="combobox"]') || f : f;
    if (msg) {
      if (!err) {
        err = document.createElement("p");
        err.className = "xz-error";
        err.id = id("error");
        field.append(err);
      }
      err.id || (err.id = id("error"));
      err.textContent = msg;
      err.hidden = false;
      shown.setAttribute("aria-invalid", "true");
      const described = (shown.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
      if (!described.includes(err.id)) shown.setAttribute("aria-describedby", [...described, err.id].join(" "));
    } else {
      shown.removeAttribute("aria-invalid");
      if (err) err.hidden = true;
    }
    return !msg;
  }
  function validate(form) {
    var _a;
    const fields = Array.from(form.elements).filter((f) => f.willValidate);
    const invalid = fields.filter((f) => !validateField2(f));
    if (invalid[0]) {
      const first = invalid[0];
      (_a = first.hidden ? (first.closest(".xz-field") || form).querySelector('[role="combobox"]') : first) == null ? void 0 : _a.focus();
    }
    return invalid.length === 0;
  }
  function initForms(root2) {
    for (const form of $$4("form[data-xz-validate]", root2)) {
      if (form.xzReady) continue;
      form.xzReady = true;
      form.noValidate = true;
      form.addEventListener("submit", (e) => {
        if (!validate(form)) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      });
      form.addEventListener("input", (e) => {
        var _a;
        const f = e.target;
        if (f.willValidate && (f.getAttribute("aria-invalid") === "true" || ((_a = f.closest(".xz-field")) == null ? void 0 : _a.querySelector('[aria-invalid="true"]')))) validateField2(f);
      });
      form.addEventListener("change", (e) => {
        var _a;
        if (e.target.willValidate && ((_a = e.target.closest(".xz-field")) == null ? void 0 : _a.querySelector('[aria-invalid="true"]'))) validateField2(e.target);
      });
    }
  }
  function initFormats(root2) {
    for (const el of $$4("[data-xz-format]", root2)) {
      const kind = el.getAttribute("data-xz-format");
      const fn = { inr, "inr-compact": inrCompact, number, compact, date, "date-short": dateShort, "date-time": dateTime, relative, percent }[kind];
      if (!fn) continue;
      if (!el.hasAttribute("data-value")) el.setAttribute("data-value", el.textContent.trim());
      const value = el.getAttribute("data-value");
      el.textContent = fn(kind.startsWith("date") || kind === "relative" ? value : Number(value));
    }
  }
  function listen() {
    document.addEventListener("click", (e) => {
      var _a, _b, _c;
      const t = e.target;
      const opener = t.closest("[data-xz-open]");
      if (opener) {
        e.preventDefault();
        openDialog2(opener.getAttribute("data-xz-open"));
      }
      const closer = t.closest("[data-xz-close]");
      if (closer) closeDialog2(closer.closest("dialog"), closer.getAttribute("data-xz-close") || void 0);
      if (((_a = t.matches) == null ? void 0 : _a.call(t, "dialog.xz-modal, dialog.xz-drawer, dialog.xz-sheet, dialog.xz-command-palette")) && !t.hasAttribute("data-xz-static")) {
        const r = t.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) t.close();
      }
      const dismiss = t.closest("[data-xz-dismiss]");
      if (dismiss) (_b = dismiss.closest(".xz-alert, .xz-banner, .xz-chip, .xz-toast")) == null ? void 0 : _b.remove();
      if (t.closest("[data-xz-theme-toggle]")) theme.toggle();
      const pw = t.closest("[data-xz-password-toggle]");
      if (pw) {
        const input = (_c = pw.closest(".xz-input-group")) == null ? void 0 : _c.querySelector("input");
        if (input) {
          const show2 = input.type === "password";
          input.type = show2 ? "text" : "password";
          pw.setAttribute("aria-pressed", String(show2));
          pw.setAttribute("aria-label", show2 ? "Hide password" : "Show password");
          pw.innerHTML = icon3(show2 ? "eye-off" : "eye", { size: "sm" });
        }
      }
      const toaster = t.closest("[data-xz-toast]");
      if (toaster) toast({ message: toaster.getAttribute("data-xz-toast"), title: toaster.getAttribute("data-xz-toast-title") || void 0, variant: toaster.getAttribute("data-xz-toast-variant") || void 0 });
      const pressed = t.closest("button.xz-chip[aria-pressed], button.xz-btn[data-xz-toggle][aria-pressed], .xz-btn-group[data-xz-toggle] > .xz-btn");
      if (pressed && !pressed.disabled) {
        if (pressed.matches(".xz-chip, [data-xz-toggle]")) pressed.setAttribute("aria-pressed", String(pressed.getAttribute("aria-pressed") !== "true"));
        else for (const b of pressed.parentElement.children) b.setAttribute("aria-pressed", String(b === pressed));
        fire2(pressed, "xz:press", { pressed: pressed.getAttribute("aria-pressed") === "true" });
      }
      if (!t.closest("[data-xz-menu]")) closeMenus();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hideTip();
    });
    addEventListener("resize", () => closeMenus());
    document.addEventListener("scroll", (e) => {
      var _a, _b;
      return !((_b = (_a = e.target).closest) == null ? void 0 : _b.call(_a, ".xz-menu__list")) && closeMenus();
    }, true);
    const tipTarget = (e) => {
      var _a, _b;
      return (_b = (_a = e.target).closest) == null ? void 0 : _b.call(_a, "[data-xz-tooltip]");
    };
    document.addEventListener("mouseover", (e) => tipTarget(e) && (tip == null ? void 0 : tip.xzFor) !== tipTarget(e) && showTip(tipTarget(e)));
    document.addEventListener("mouseout", (e) => tipTarget(e) && !tipTarget(e).contains(e.relatedTarget) && hideTip());
    document.addEventListener("focusin", (e) => tipTarget(e) && e.target.matches(":focus-visible") && showTip(tipTarget(e)));
    document.addEventListener("focusout", (e) => tipTarget(e) && hideTip());
    document.addEventListener("scroll", hideTip, true);
  }
  var plugins = [];
  var started = false;
  var helpers = { icon: icon3, format: format_exports, place, placeAt, fire: fire2, esc: esc2, nextId, store, watch, perFrame, motionOn, onMotion, isRtl, dirKey, ready: ready2, sanitize, copy, toast, openDialog: openDialog2, closeDialog: closeDialog2, init };
  function use(plugin) {
    var _a;
    if (!plugin || plugins.includes(plugin)) return Xsenze;
    plugins.push(plugin);
    if (plugin.name && plugin.api) Xsenze[plugin.name] = plugin.api;
    if (started && typeof document !== "undefined") (_a = plugin.init) == null ? void 0 : _a.call(plugin, document, helpers);
    return Xsenze;
  }
  var listening = false;
  function init(root2 = document) {
    var _a;
    if (!listening) {
      listening = true;
      theme.restore();
      listen();
    }
    initIcons(root2);
    initTabs(root2);
    initMenus(root2);
    initComboboxes(root2);
    initTables(root2, { icon: icon3, init });
    initForms(root2);
    initFormats(root2);
    initSparklines(root2);
    initAdvancedForms(root2, { icon: icon3 });
    initComponents(root2, { icon: icon3, validateField: validateField2 });
    initCommands(root2, { icon: icon3, openDialog: openDialog2, closeDialog: closeDialog2 });
    initCalendars(root2, { icon: icon3 });
    initHovercards(root2);
    initTrees(root2, { icon: icon3 });
    initLayout(root2, { icon: icon3 });
    initBlocks(root2, { icon: icon3 });
    for (const p of plugins) (_a = p.init) == null ? void 0 : _a.call(p, root2, helpers);
    started = true;
    theme.sync();
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => init());
    else init();
  }
  var Xsenze = {
    version: "0.10.0",
    init,
    icon: icon3,
    icons: Object.keys(icons_generated_default),
    theme,
    modal: { open: openDialog2, close: closeDialog2 },
    drawer: { open: openDialog2, close: closeDialog2 },
    sheet: { open: openDialog2, close: closeDialog2 },
    confirm,
    toast,
    validate,
    format: format_exports,
    sanitize,
    motion,
    copy,
    command,
    use
  };
  if (typeof window !== "undefined") {
    const waiting2 = window.XsenzePlugins;
    if (Array.isArray(waiting2)) waiting2.splice(0).forEach(use);
  }
  var index_default = Xsenze;
  return __toCommonJS(index_exports);
})();
Xsenze = Xsenze.default;
