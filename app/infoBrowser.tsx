export function getOSInfo() {
  let os = "Unknown OS";
  if (typeof window !== "undefined") {
    const userAgent = navigator.userAgent;

    if (userAgent.indexOf("Win") !== -1) os = "Windows";
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return "iOS";
    }
    if (userAgent.indexOf("Mac") !== -1) os = "MacOS";
    if (userAgent.indexOf("X11") !== -1 || userAgent.indexOf("Linux") !== -1)
      os = "Linux";
    if (userAgent.indexOf("Android") !== -1) os = "Android";
  }
  return os;
}

export function getBrowserInfo() {
  let browserName = "Unknown Browser";
  if (typeof window !== "undefined") {
    let userAgent = navigator.userAgent;

    if (userAgent.indexOf("Firefox") > -1) {
      browserName = "Mozilla Firefox";
    } else if (userAgent.indexOf("SamsungBrowser") > -1) {
      browserName = "Samsung Internet";
    } else if (
      userAgent.indexOf("Opera") > -1 ||
      userAgent.indexOf("OPR") > -1
    ) {
      browserName = "Opera";
    } else if (userAgent.indexOf("Trident") > -1) {
      browserName = "Microsoft Internet Explorer";
    } else if (userAgent.indexOf("Edge") > -1) {
      browserName = "Microsoft Edge";
    } else if (userAgent.indexOf("Chrome") > -1) {
      browserName = "Google Chrome";
    } else if (userAgent.indexOf("Safari") > -1) {
      browserName = "Apple Safari";
    }
  }
  return browserName;
}
