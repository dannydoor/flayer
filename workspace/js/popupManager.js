/*
 * 모달과 토스트를 아우르는 모든 팝업 요소들을 관리
 * 해당 요소들의 전시와 숨기기, 핸들러를 모두 관장.
 */

class PopupManager {
  constructor() {
    this.storehouse = window["popup-storehouse"];
    PopupManager.createModal = PopupManager.createModal.bind(this);
    PopupManager.createToast = PopupManager.createToast.bind(this);
    PopupManager.hideModal = PopupManager.hideModal.bind(this);
    this.idToPass = undefined;
    window["modal-backdrop"].addEventListener("click", this.handler.bind(this));
    window["manage-hided-modal"].addEventListener(
      "click",
      this.hideManagingHandler
    );
    setting.addEventListener("click", this.settingHandler);
    this.timerId = null;
  }

  static createModal(type, id = undefined) {
    this.idToPass = id;

    let backdrop = window["modal-backdrop"],
      target;
    switch (type) {
      case "queue": {
        target = window["queue-modal"];
        break;
      }
      case "playlist-delete": {
        target = window["playlist-delete-modal"];
        break;
      }
      case "playlist-add": {
        target = window["playlist-add-modal"];
        break;
      }
      case "tab": {
        target = window["tab-modal"];
        break;
      }
      case "cancel": {
        target = window["edit-cancel-modal"];
        break;
      }
      case "hide": {
        target = window["item-hide-modal"];
        break;
      }
      case "updated": {
        target = window["setting-updated-modal"];
        break;
      }
      case "reset": {
        target = window["reset-modal"];
        break;
      }
      case "clear-record": {
        target = window["clear-record-modal"];
        break;
      }
      case "alert": {
        target = window["alert-modal"];
        break;
      }
    }

    if (target.timerId) {
      clearTimeout(target.timerId);
      clearTimeout(backdrop.timerId);
      target.timerId = null;
      backdrop.timerId = null;
    }

    backdrop.classList.remove("out");
    target.classList.remove("out");
    if (type == "updated" || type == "reset") {
      backdrop.before(setting);
    } else {
      document.body.append(window["modal-backdrop"]);
    }
    backdrop.append(target);
  }

  static showSetting() {
    let backdrop = window["modal-backdrop"];

    if (setting.timerId) {
      clearTimeout(setting.timerId);
      clearTimeout(backdrop.timerId);
      setting.timerId = null;
      backdrop.timerId = null;
    }

    setting.classList.remove("out");
    backdrop.classList.remove("out");

    document.body.append(backdrop);
    document.body.append(setting);
  }

  static createToast(type) {
    let toast = document.body.querySelector(".popup");

    if (toast) {
      this.storehouse.append(toast);
    }

    switch (type) {
      case "added": {
        document.body.append(window["added-to-playlist"]);
        break;
      }
      case "liked": {
        document.body.append(window["liked"]);
        break;
      }
      case "disliked": {
        document.body.append(window["disliked"]);
        break;
      }
      case "next": {
        document.body.append(window["added-next"]);
        break;
      }
      case "later": {
        document.body.append(window["added-later"]);
        break;
      }
    }

    toast = document.body.querySelector(".popup");

    setTimeout(() => {
      this.storehouse.append(toast);
    }, 2000);
  }

  handler(e) {
    let func = e.target.dataset.func,
      modal = e.target.closest(".modal"),
      backdrop = window["modal-backdrop"],
      isPlaylist = modal == window["playlist-delete-modal"],
      isHiding = modal == window["item-hide-modal"],
      isReset = modal == window["reset-modal"],
      isUpdated = modal == window["setting-updated-modal"],
      isCanceling = modal == window["edit-cancel-modal"],
      isClearing = modal == window["clear-record-modal"];

    if (!func) return;
    else {
      switch (func) {
        case "keep": {
          queueManager.processMusicToPlay(true);
          break;
        }
        case "clear": {
          queueManager.processMusicToPlay(false);
          break;
        }
        case "commit": {
          if (isPlaylist) playlistManager.deletePlaylist(this.idToPass);
          else if (isHiding) {
            dbManager.hideElem(this.idToPass);
          } else if (isReset) {
            dbManager.resetLs();
          } else if (isCanceling) {
            playlistManager.editManager.discardEditing();
          } else if (isClearing) {
            queueManager.clearRecord();
          }
        }
        case "cancel": {
          this.idToPass = undefined;
          break;
        }
      }
      PopupManager.hideModal(modal);
      if (isReset || isUpdated) {
        document.body.append(setting);
        return;
      }
      PopupManager.hideModal(backdrop);
    }
  }

  settingHandler(e) {
    let func = e.target.dataset.func,
      backdrop = window["modal-backdrop"];

    if (!func) return;
    else {
      switch (func) {
        case "upload-db": {
          dbManager.updateDb();
          break;
        }
        case "download-ls": {
          dbManager.exportLs();
          break;
        }
        case "upload-ls": {
          dbManager.importLs();
          break;
        }
        case "reset-ls": {
          PopupManager.createModal("reset");
          break;
        }
        case "manage-hided": {
          popupManager.showHideManager();
          break;
        }
        case "theme": {
          let state = e.target.dataset.state;
          if (state == "on") {
            dbManager.toggleDarkTheme("off");
          } else {
            dbManager.toggleDarkTheme("on");
          }
          break;
        }
        case "exit": {
          PopupManager.hideModal(setting);
          PopupManager.hideModal(backdrop);
        }
      }
    }
  }

  hideManagingHandler(e) {
    let targetItem = e.target.closest(".modal-item"),
      modal = e.target.closest(".modal"),
      func = e.target.dataset.func;

    if (!targetItem && !func) return;
    else if (!func) {
      let id = targetItem.dataset.id,
        isChecked = targetItem.dataset.checked;

      if (isChecked == "true") {
        dbManager.toRelease.splice(dbManager.toRelease.indexOf(id), 1);
        targetItem.setAttribute("data-checked", false);
      } else {
        dbManager.toRelease.push(id);
        targetItem.setAttribute("data-checked", true);
      }
      let btn = window["manage-hided-modal"].querySelector(
        '[data-func="commit"]'
      );

      if (!dbManager.toRelease.length) {
        btn.disabled = true;
      } else {
        btn.disabled = false;
      }
    } else {
      switch (func) {
        case "commit": {
          dbManager.releaseHided();
          PopupManager.createModal("updated");
          break;
        }
        case "cancel": {
          window["modal-backdrop"].after(setting);
          break;
        }
      }
      PopupManager.hideModal(modal);
      modal.querySelector(".content").innerHTML = "";
    }
  }

  showHideManager() {
    let modal = window["manage-hided-modal"],
      content = modal.querySelector(".content");

    if (modal.timerId) {
      clearTimeout(modal.timerId);
      modal.timerId = null;
    }

    modal.classList.remove("out");

    for (let id in DbManager.db) {
      if (DbManager.db[id].isHided) {
        content.append(builder(id));
      }
    }

    modal.querySelector('[data-func="commit"]').disabled = true;

    window["modal-backdrop"].before(setting);
    document.body.append(modal);

    function builder(id) {
      let obj = DbManager.db[id];

      let div = document.createElement("div"),
        desc = document.createElement("div"),
        title = document.createElement("span"),
        artist = document.createElement("span"),
        checkbox = document.createElement("div");

      div.classList.add("modal-item");
      div.setAttribute("data-checked", false);
      div.setAttribute("data-id", id);

      desc.classList.add("modal-item-desc");
      title.classList.add("modal-item-title");
      artist.classList.add("modal-item-artist");
      checkbox.classList.add("checkbox");

      title.innerHTML = obj.title;
      artist.innerHTML = "- " + obj.artist;

      desc.append(title, artist);
      div.append(desc, checkbox);

      return div;
    }
  }

  static hideModal(elem) {
    elem.classList.add("out");

    elem.timerId = setTimeout(() => {
      window["popup-storehouse"].append(elem);
    }, 500);
  }
}
