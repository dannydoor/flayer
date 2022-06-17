// 컨텍스트 메뉴의 생성과 조합을 관장
class ContextmenuManager {
  constructor() {
    document.body.addEventListener(
      "click",
      ContextmenuManager.returnToStorehouse
    );

    this.librarySearchOpt = window["library-search-opt"];
    this.librarySortOpt = window["library-sort-opt"];
    this.librarySearchOpt.onclick = this.librarySortOpt.onclick =
      this.toggleCheck;
    this.librarySearchOpt.firstElementChild.onclick = this.updateSearchFilter;
    this.librarySearchOpt.lastElementChild.onclick = this.updateShowOpt;
    this.librarySortOpt.firstElementChild.onclick =
      this.librarySortOpt.lastElementChild.onclick = this.updateSortMode;
  }

  static returnToStorehouse() {
    let contextmenu = document.querySelector(".container .contextmenu");
    if (contextmenu) {
      window["contextmenu-storehouse"].append(contextmenu);
    }
  }

  static addContextmenu(elem, type) {
    ContextmenuManager.returnToStorehouse();
    elem.append(window[type]);
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

  updateSearchFilter(e) {
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

  updateShowOpt(e) {
    if (!e.target.classList.contains("item")) return;
    if (e.target.classList.contains("checked")) return;

    let type = e.target.classList[1];

    window["library-container"].classList.remove("only-liked");
    window["library-container"].classList.remove("only-new");

    switch (type) {
      case "liked": {
        window["library-container"].classList.add("only-liked");
        break;
      }
      case "new": {
        window["library-container"].classList.add("only-new");
      }
    }

    libraryManager.updateDisplayedCounts();
  }

  updateSortMode(e) {
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
