// 왼쪽 탭에 띄워질 창을 제어.

class TabManager {
  constructor() {
    this.buttonContainer = window["menu-buttons"];
    window["video"].append(this.buttonContainer);
  }

  static toggle(id) {
    let target = window[`${id}-container`];
    let storehouse = window["element-storehouse"];

    if (target.parentNode == tab) {
      storehouse.append(target);
    } else {
      tab.append(target);
    }

    if (tab.classList.contains("invisible")) tab.classList.remove("invisible");
    if (!tab.childElementCount) tab.classList.add("invisible");
  }
}
