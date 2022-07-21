// 왼쪽 탭에 띄워질 창을 제어.

class TabManager {
  constructor() {
    TabManager.hideAll = TabManager.hideAll.bind(this);
    TabManager.showContent = TabManager.showContent.bind(this);
    TabManager.toggleQueue = TabManager.toggleQueue.bind(this);
    this.timerId = null;
    this.menuBtns = window["menu-buttons"];
    this.isEditing = false;

    const menuBtn = window["open-menu"],
      libraryBtn = window["open-library"],
      playlistBtn = window["open-playlist"],
      mainMenu = window["main-menu"];

    this.menuBtns.onmouseleave = () => {
      this.timerId = setTimeout(() => {
        this.menuBtns.classList.add("invisible");
      }, 1600);
    };

    this.menuBtns.onmouseover = () => {
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
      this.menuBtns.classList.remove("invisible");
    };

    tab.onclick = (e) => {
      let isMusic = !!e.target.closest(".music-item");
      if (isMusic) return;
      else {
        document
          .querySelector(".music-item.active")
          ?.classList.remove("active");
      }
    };

    menuBtn.onclick = (e) => {
      if (this.editCheck()) return;

      const btn = e.target;
      let isVisible = !tab.classList.contains("invisible"),
        isAlone = tab.childElementCount == 1 && tab.contains(mainMenu);

      if (!isVisible) {
        TabManager.showContent("main-menu");
        tab.classList.remove("invisible");
        btn.classList.add("active");
      } else {
        if (isAlone) {
          TabManager.hideContent("main-menu");
          tab.classList.add("invisible");
          btn.classList.remove("active");
        } else {
          this.initContent();
          TabManager.showContent("main-menu");
          btn.classList.add("active");
        }
      }
    };

    libraryBtn.onclick = (e) => {
      if (this.editCheck()) return;

      const btn = e.target,
        menuBtn = window["open-menu"];
      let isTabInvisible = tab.classList.contains("invisible");

      if (isTabInvisible) {
        menuBtn.click();
        TabManager.showContent("library-container");
        btn.classList.add("active");
      } else {
        this.initContent();
        TabManager.showContent("main-menu");
        TabManager.showContent("library-container");
        btn.classList.add("active");
      }
    };

    playlistBtn.onclick = (e) => {
      if (this.editCheck()) return;

      const btn = e.target,
        menuBtn = window["open-menu"];
      let isTabInvisible = tab.classList.contains("invisible");

      if (isTabInvisible) {
        menuBtn.click();
        TabManager.showContent("playlist-list-container");
        btn.classList.add("active");
      } else {
        this.initContent();
        TabManager.showContent("main-menu");
        TabManager.showContent("playlist-list-container");
        btn.classList.add("active");
      }
    };

    // 메뉴 버튼
    mainMenu.onclick = (e) => {
      let func = e.target.dataset.func;

      if (!func) return;
      switch (func) {
        case "library": {
          libraryBtn.click();
          break;
        }
        case "playlist": {
          playlistBtn.click();
          break;
        }
        case "setting": {
          PopupManager.showSetting();
          break;
        }
        case "help": {
          break;
        }
      }
    };

    // 닫기 버튼
    let hideLibrary = document.querySelector("#library-container .hide-button"),
      hidePlaylist = document.querySelector(
        "#playlist-list-container .hide-button"
      );

    hideLibrary.onclick = () => {
      TabManager.hideContent("library-container");
      window["open-library"].classList.remove("active");
    };
    hidePlaylist.onclick = () => {
      TabManager.hideContent("playlist-list-container");
      window["open-playlist"].classList.remove("active");
    };

    // 닫기 버튼
    let closeBtns = document.querySelectorAll(".close-button");
    closeBtns.forEach((item) => {
      item.onclick = TabManager.hideAll;
    });
    document.querySelector("#queue-container .close-button").onclick = () =>
      TabManager.toggleQueue();
  }

  static showContent(id) {
    let target = window[id];
    target.classList.remove("out");
    tab.append(target);
    return;
  }

  static hideContent(id) {
    let target = window[id];
    window["element-storehouse"].append(target);
  }

  static hideFloat(id) {
    let target = window[id];
    target.classList.add("out");

    setTimeout(() => {
      window["element-storehouse"].append(target);
    }, 500);
  }

  static hideAll() {
    this.initContent();
    let buttons = window["menu-buttons"].querySelectorAll("button");

    buttons.forEach((element) => {
      element.classList.remove("active");
    });

    tab.classList.add("invisible");
  }

  static toggleQueue() {
    if (this.isEditing) {
      PopupManager.createModal("tab");
      return;
    }

    let queueContainer = window["queue-container"],
      isVisible = queueContainer.parentNode == tab,
      isFloat = !!queueContainer.previousElementSibling;

    if (isVisible) {
      if (!isFloat) tab.classList.add("invisible");
      else TabManager.hideFloat("backdrop");
      TabManager.hideFloat("queue-container");
      window["open-queue"].classList.remove("active");
    } else {
      if (tab.classList.contains("invisible"))
        tab.classList.remove("invisible");
      else {
        TabManager.showContent("backdrop");
      }
      TabManager.showContent("queue-container");
      window["open-queue"].classList.add("active");
    }
  }

  initContent() {
    let storehouse = window["element-storehouse"];

    const count = tab.childElementCount;

    for (let i = count; i >= 0; i--) {
      const element = tab.children[i];
      storehouse.append(element);
    }

    window["open-queue"].classList.remove("active");
    window["open-library"].classList.remove("active");
    window["open-playlist"].classList.remove("active");
  }

  editCheck() {
    // 현재 플레이리스트 편집 중인지를 체크
    if (this.isEditing) {
      PopupManager.createModal("tab");
      return true;
    } else {
      return false;
    }
  }
}
