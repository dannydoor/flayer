//컨텍스트메뉴를 포함해 각종 작은 메뉴의 생성과 핸들러를 관장
class ContextmenuManager {
  constructor() {
    document.body.addEventListener(
      "click",
      ContextmenuManager.returnToStorehouse
    );

    this.initLibraryElem();
    this.initSelectableElem();
    this.initControllerOpt();
    this.initCreateElem();
    this.initCreateAddElem();
    this.initPlaylistOpt();
    this.initPlaylistSortElem();
    this.initPlaylistItemOpt();
    this.initLibraryItemOpt();
    this.initQueueItemOpt();
  }

  static returnToStorehouse() {
    let contextmenu = document.querySelector(".container .contextmenu");
    if (contextmenu) {
      window["contextmenu-storehouse"].append(contextmenu);
      if (contextmenu.id.includes("item-opt")) {
        contextmenu.style.top = "";
        contextmenu.style.bottom = "";
      }
    }
  }

  static addContextmenu(elem, type) {
    ContextmenuManager.returnToStorehouse();
    let target = window[type];
    if (target === undefined) return;
    elem.append(target);
  }

  static addItemContextmenu(elem) {
    ContextmenuManager.returnToStorehouse();
    let type =
        elem.classList.contains("library") || elem.classList.contains("record")
          ? "library"
          : elem.classList.contains("queue")
          ? "queue"
          : elem.classList.contains("playlist")
          ? "playlist"
          : "controller",
      targetElem = window[type + "-item-opt"];

    // 플레이리스트 보기 활성화/비활성화
    if (
      (type == "controller" &&
        !controller?.currentInfo.context.startsWith("playlist:")) ||
      (type == "queue" && !elem.context.startsWith("playlist:"))
    ) {
      targetElem.querySelector(".show")?.classList.add("disabled");
    } else {
      targetElem.querySelector(".show")?.classList.remove("disabled");
    }

    if (type == "controller") {
      window["meatballs-button"].append(targetElem);
    } else {
      elem.querySelector(".button-field")?.append(targetElem);
    }

    // 위치 정해주기
    let elemHeight = targetElem.offsetHeight,
      diff =
        elem.offsetParent.scrollTop +
        elem.offsetParent.offsetHeight -
        elem.offsetTop -
        48;

    if (type == "controller" || diff < elemHeight) {
      targetElem.style.top = "";
      targetElem.style.bottom = "calc(100% + 8px)";
    } else {
      targetElem.style.top = "calc(100% + 8px)";
      targetElem.style.bottom = "";
    }
  }

  initLibraryElem() {
    let librarySearchOpt = window["library-search-opt"],
      librarySortOpt = window["library-sort-opt"],
      container = window["library-container"];
    librarySearchOpt.onclick = librarySortOpt.onclick = this.toggleCheck;
    librarySearchOpt.firstElementChild.onclick = updateSearchFilter;
    librarySearchOpt.lastElementChild.onclick = updateShowOpt;
    librarySortOpt.firstElementChild.onclick =
      librarySortOpt.lastElementChild.onclick = updateSortMode;

    function updateSearchFilter(e) {
      if (!e.target.classList.contains("item")) return;
      if (e.target.classList.contains("checked")) return;

      let type = e.target.classList[1];

      librarySearchElem.removeTag();

      switch (type) {
        case "title": {
          librarySearchElem.addTag("제목");
          break;
        }
        case "artist": {
          librarySearchElem.addTag("가수");
          break;
        }
      }

      librarySearchElem.inputBox.dispatchEvent(changeEvent);
    }

    function updateShowOpt(e) {
      if (!e.target.classList.contains("item")) return;
      if (e.target.classList.contains("checked")) return;

      let type = e.target.classList[1];

      container.classList.remove("only-liked");
      container.classList.remove("only-new");

      switch (type) {
        case "liked": {
          container.classList.add("only-liked");
          break;
        }
        case "new": {
          container.classList.add("only-new");
        }
      }

      libraryManager.updateDisplayedCounts();
    }

    function updateSortMode(e) {
      let targetValue = e.target.dataset.value,
        sortParam;

      if (targetValue < 2) {
        sortParam =
          window["library-sort-opt"].firstElementChild.querySelector(".checked")
            .dataset.value;
      } else {
        sortParam =
          window["library-sort-opt"].lastElementChild.querySelector(".checked")
            .dataset.value;
      }

      libraryManager.updateSortMode(sortParam * targetValue);
      Controller.updatePlayingItems();
    }
  }

  initSelectableElem() {
    let selectableSearchOpt = window["selectable-search-opt"],
      selectableSortOpt = window["selectable-sort-opt"],
      container = window["selectable-container"];
    selectableSearchOpt.onclick = selectableSortOpt.onclick = this.toggleCheck;
    selectableSearchOpt.firstElementChild.onclick = updateSearchFilter;
    selectableSearchOpt.lastElementChild.onclick = updateShowOpt;
    selectableSortOpt.firstElementChild.onclick =
      selectableSortOpt.lastElementChild.onclick = updateSortMode;

    function updateSearchFilter(e) {
      if (!e.target.classList.contains("item")) return;
      if (e.target.classList.contains("checked")) return;

      let type = e.target.classList[1];

      selectableSearchElem.removeTag();

      switch (type) {
        case "title": {
          selectableSearchElem.addTag("제목");
          break;
        }
        case "artist": {
          selectableSearchElem.addTag("가수");
          break;
        }
      }

      selectableSearchElem.inputBox.dispatchEvent(changeEvent);
    }

    function updateShowOpt(e) {
      if (!e.target.classList.contains("item")) return;
      if (e.target.classList.contains("checked")) return;

      let type = e.target.classList[1];

      container.classList.remove("only-liked");
      container.classList.remove("only-new");

      switch (type) {
        case "liked": {
          container.classList.add("only-liked");
          break;
        }
        case "new": {
          container.classList.add("only-new");
        }
      }

      playlistManager.selectableManager.updateDisplayedCounts();
    }

    function updateSortMode(e) {
      let targetValue = e.target.dataset.value,
        sortParam;

      if (targetValue < 2) {
        sortParam =
          window["selectable-sort-opt"].firstElementChild.querySelector(
            ".checked"
          ).dataset.value;
      } else {
        sortParam =
          window["selectable-sort-opt"].lastElementChild.querySelector(
            ".checked"
          ).dataset.value;
      }

      playlistManager.selectableManager.updateSortMode(sortParam * targetValue);
      Controller.updatePlayingItems();
    }
  }

  initPlaylistSortElem() {
    let target = window["playlist-sort-opt"];
    target.onclick = this.toggleCheck;
    target.firstElementChild.onclick = target.lastElementChild.onclick =
      updateSortMode;

    function updateSortMode(e) {
      let elem = e.target,
        menu = e.target.closest(".contextmenu"),
        sortMode,
        value = parseInt(elem.dataset.value),
        isFirst =
          elem.classList.contains("ascend") ||
          elem.classList.contains("descend");

      if (isFirst) {
        sortMode = parseInt(
          menu.lastElementChild.querySelector(".checked").dataset.value
        );
        playlistManager.updateListSortMode(value + 2 * sortMode);
      } else {
        sortMode = parseInt(
          menu.firstElementChild.querySelector(".checked").dataset.value
        );
        playlistManager.updateListSortMode(2 * value + sortMode);
      }
    }
  }

  initCreateElem() {
    let target = window["playlist-create-opt"];
    target.querySelector(".create").onclick = () =>
      playlistManager?.editManager.buildEditElement();
    target.querySelector(".file").onclick = () => {
      playlistManager?.importPlaylist();
    };
  }

  initCreateAddElem() {
    let target = window["playlist-create-opt-add"];
    target.querySelector(".create").onclick = () => {
      playlistManager?.editManager.buildEditElement();
      playlistManager?._addToEditor();
    };

    target.querySelector(".file").onclick = () => {
      playlistManager?.importPlaylist(true);
    };
  }

  initPlaylistOpt() {
    let target = window["playlist-opt"];

    target.querySelector(".edit").onclick = (e) => {
      let id = e.target.closest(".tab-container").id,
        obj = playlistManager.table[id];
      playlistManager.editManager.buildEditElement(obj);
    };

    target.querySelector(".delete").onclick = (e) => {
      let id = e.target.closest(".tab-container").id;
      PopupManager.createModal("playlist-delete", id);
    };

    target.querySelector(".to-playlist").onclick = (e) => {
      let id = e.target.closest(".tab-container").id,
        arr = playlistManager.table[id].arr;
      PlaylistManager.addToPlaylist(...arr);
    };

    target.querySelector(".download").onclick = (e) => {
      let id = e.target.closest(".tab-container").id;
      playlistManager.exportPlaylist(id);
    };

    target.querySelector(".next").onclick = (e) => {
      let id = e.target.closest(".tab-container").id,
        arr = playlistManager.table[id].arr.map((key) => {
          return DbManager.db[key];
        });
      QueueManager.playNext(arr, "playlist:" + id);
    };

    target.querySelector(".later").onclick = (e) => {
      let id = e.target.closest(".tab-container").id,
        arr = playlistManager.table[id].arr.map((key) => {
          return DbManager.db[key];
        });
      QueueManager.playLater(arr, "playlist:" + id);
    };

    target.onclick = (e) => {
      ContextmenuManager.returnToStorehouse();
      e.stopPropagation();
    };
  }

  initControllerOpt() {
    let target = window["controller-item-opt"];

    target.querySelector(".to-playlist").onclick = () => {
      if (tab.classList.contains("invisible")) {
        window["open-menu"].click();
      }
      PlaylistManager.addToPlaylist(controller?.currentInfo?.reference);
    };

    target.querySelector(".next").onclick = () => {
      QueueManager.playNext(controller?.currentInfo?.reference);
    };

    target.querySelector(".later").onclick = () => {
      QueueManager.playLater(controller?.currentInfo?.reference);
    };

    target.querySelector(".show:not(.disabled)").onclick = () => {
      window["open-curr-playlist"].click();
    };

    target.querySelector(".hide").onclick = () => {
      let id = controller.currentInfo.id;
      PopupManager.createModal("hide", id);
    };

    target.onclick = (e) => {
      ContextmenuManager.returnToStorehouse();
      e.stopPropagation();
    };
  }

  initPlaylistItemOpt() {
    let target = window["playlist-item-opt"];

    target.querySelector(".delete").onclick = (e) => {
      let elem = e.target.closest(".music-item");
      playlistManager.editManager.deleteSongExternal(elem);
    };

    target.querySelector(".to-playlist").onclick = (e) => {
      let id = e.target.closest(".music-item").getAttribute("music-id");
      PlaylistManager.addToPlaylist(id);
    };

    target.querySelector(".next").onclick = (e) => {
      let obj = e.target.closest(".music-item").musicObj,
        context = e.target.closest(".music-item").context;
      QueueManager.playNext(obj, context);
    };

    target.querySelector(".later").onclick = (e) => {
      let obj = e.target.closest(".music-item").musicObj,
        context = e.target.closest(".music-item").context;
      QueueManager.playLater(obj, context);
    };

    target.querySelector(".like").onclick = (e) => {
      e.target.closest(".music-item").toggleLikeState();
    };

    target.querySelector(".hide").onclick = (e) => {
      let id = e.target.closest(".music-item").getAttribute("music-id");
      PopupManager.createModal("hide", id);
    };

    target.onclick = (e) => {
      ContextmenuManager.returnToStorehouse();
      e.stopPropagation();
    };
  }

  initLibraryItemOpt() {
    let target = window["library-item-opt"];

    target.querySelector(".to-playlist").onclick = (e) => {
      let id = e.target.closest(".music-item").getAttribute("music-id");
      PlaylistManager.addToPlaylist(id);
    };

    target.querySelector(".next").onclick = (e) => {
      let obj = e.target.closest(".music-item").musicObj,
        context = e.target.closest(".music-item").context;
      QueueManager.playNext(obj, context);
    };

    target.querySelector(".later").onclick = (e) => {
      let obj = e.target.closest(".music-item").musicObj,
        context = e.target.closest(".music-item").context;
      QueueManager.playLater(obj, context);
    };

    target.querySelector(".like").onclick = (e) => {
      e.target.closest(".music-item").toggleLikeState();
    };

    target.querySelector(".hide").onclick = (e) => {
      let id = e.target.closest(".music-item").getAttribute("music-id");
      PopupManager.createModal("hide", id);
    };

    target.onclick = (e) => {
      ContextmenuManager.returnToStorehouse();
      e.stopPropagation();
    };
  }

  initQueueItemOpt() {
    let target = window["queue-item-opt"];

    target.querySelector(".delete").onclick = (e) => {
      let elem = e.target.closest(".music-item");
      ContextmenuManager.returnToStorehouse();
      QueueManager.deleteQueueItem(elem);
    };

    target.querySelector(".to-playlist").onclick = (e) => {
      e.stopPropagation();
      let elem = e.target.closest(".music-item"),
        id = elem.getAttribute("music-id");
      PlaylistManager.addToPlaylist(id);
    };

    target.querySelector(".next").onclick = (e) => {
      let elem = e.target.closest(".music-item");
      QueueManager.moveNext(elem);
    };

    target.querySelector(".show").onclick = (e) => {
      let isVisible =
          window["open-playlist"].classList.contains("active") &&
          tab.children.length == 2,
        context = e.target.closest(".music-item").getAttribute("context"),
        isValid = context.startsWith("playlist:"),
        id = context.slice(9);

      if (!isValid) return;

      if (isVisible) {
        TabManager.showContent(id);
      } else {
        window["open-playlist"].click();
        TabManager.showContent(id);
      }
    };

    target.querySelector(".like").onclick = (e) => {
      e.target.closest(".music-item").toggleLikeState();
    };

    target.querySelector(".hide").onclick = (e) => {
      let id = e.target.closest(".music-item").getAttribute("music-id");
      PopupManager.createModal("hide", id);
    };

    target.onclick = (e) => {
      ContextmenuManager.returnToStorehouse();
      e.stopPropagation();
    };

    // 이거 안 하면 자꾸 드래그 됨.
    target.onmousedown = (e) => {
      e.stopPropagation();
    };
  }

  toggleCheck(e) {
    e.stopPropagation();
    if (!e.target.classList.contains("item")) return;
    if (e.target.classList.contains("checked")) return;

    e.target.parentElement
      .querySelector(".checked")
      ?.classList.remove("checked");
    e.target.classList.add("checked");
  }
}
