// 라이브러리의 정렬과 검색을 관장

class LibraryManager {
  constructor(objHashTable, sortMode = 0) {
    // 0: 제목 - 가수 오름차순 | 1: 제목 - 가수 내림차순 | 2: 가수 - 제목 오름차순 | 3: 가수 - 제목 내림차순
    this.musicObjArr = [];
    for (let key in objHashTable) {
      this.musicObjArr.push(objHashTable[key]);
    }

    this.sortMode = sortMode;

    this.sortedArr = [[], [], [], []];
    [
      this.sortedArr[0],
      this.sortedArr[1],
      this.sortedArr[2],
      this.sortedArr[3],
    ] = ObjectFactory.getSortedArr(objHashTable);
    this.sortedFragment = [];
    this.sortedKeyTable = [{}, {}, {}, {}];
    this.sortedValueTable = [{}, {}, {}, {}];

    for (let i = 0; i < 4; i++) {
      this.sortedFragment.push(new DocumentFragment());
      this.sortedArr[i].forEach((item, index) => {
        this.sortedKeyTable[i][item.id] = index;
        this.sortedValueTable[i][index] = item;

        let elem = document.createElement("div", { is: "library-item" });
        elem.setup(item);
        this.sortedFragment[i].append(elem);
      });
    }

    this.libraryContainer = window["library-container"];
    this.libraryContainerContent = window["library-content"];
    this.libraryContainerContent.append(
      this.sortedFragment[this.sortMode].cloneNode(true)
    );
    this.initSortOpt();

    this.updateDisplayedCounts();

    this.libraryContainer.querySelector(".close-button").onclick = (e) => {
      e.preventDefault();

      document.querySelector(".open-tab").click();
    };
    window["library-search-opt-btn"].onclick = this.libraryBtnHandler("search");
    window["library-sort-btn"].onclick = this.libraryBtnHandler("sort");

    this.tempTabButton = document.querySelector(".open-tab");
    this.tempTabButton.onclick = (e) => {
      e.preventDefault();

      if (window["open-queue"].classList.contains("active")) {
        window["open-queue"].click();
        if (!e.target.classList.contains("active")) {
          e.target.classList.toggle("active");
          TabManager.toggle("library");
        }
      } else {
        e.target.classList.toggle("active");
        TabManager.toggle("library");
      }
    };
  }

  initSortOpt() {
    let sortOpt = window["library-sort-opt"];

    if (this.sortMode < 2) {
      sortOpt.querySelector(".title").classList.add("checked");
    } else {
      sortOpt.querySelector(".artist").classList.add("checked");
    }

    if (!(this.sortMode % 2)) {
      sortOpt.querySelector(".ascend").classList.add("checked");
    } else {
      sortOpt.querySelector(".descend").classList.add("checked");
    }
  }

  updateDisplayedCounts() {
    let isSearching = this.libraryContainer.classList.contains("searching")
        ? ".searched"
        : "",
      isLikedOnly = this.libraryContainer.classList.contains("only-liked")
        ? "[is-liked=true]"
        : "",
      isNewOnly = this.libraryContainer.classList.contains("only-new")
        ? "[is-new=true]"
        : "";

    let counts = this.libraryContainer.querySelectorAll(
      `.music-item${isSearching}${isLikedOnly}${isNewOnly}`
    ).length;

    window["displayed-counts"].innerHTML = counts;
  }

  updateSortMode(param) {
    this.libraryContainerContent.innerHTML = "";

    if (param < 0) {
      param = -param;
    } else {
      param -= 2;
    }

    this.sortMode = param;
    this.libraryContainerContent.append(
      this.sortedFragment[this.sortMode].cloneNode(true)
    );

    window["library-search-field"].dispatchEvent(changeEvent);
    QueueManager.makeUpLibraryItem(true);
    Controller.updateByQueueChange();
  }

  libraryBtnHandler(type) {
    return (e) => {
      e.stopPropagation();

      let target = e.target.closest(".library-btn");

      if (target.querySelector(".contextmenu")) {
        ContextmenuManager.returnToStorehouse();
      } else {
        ContextmenuManager.addContextmenu(target, "library-" + type + "-opt");
      }
    };
  }

  getPrevObj(id) {
    let index = this.sortedKeyTable[this.sortMode][id];
    return this.sortedValueTable[this.sortMode][index - 1];
  }

  getNextObj(id) {
    let index = this.sortedKeyTable[this.sortMode][id];
    return this.sortedValueTable[this.sortMode][index + 1];
  }

  getFirstObj() {
    return this.sortedValueTable[this.sortMode][0];
  }

  getLastObj() {
    return this.sortedValueTable[this.sortMode][this.sortedArr.length - 1];
  }

  getFilteredContents() {
    let isSearching = this.libraryContainer.classList.contains("searching")
        ? ".searched"
        : "",
      isLikedOnly = this.libraryContainer.classList.contains("only-liked")
        ? "[is-liked=true]"
        : "",
      isNewOnly = this.libraryContainer.classList.contains("only-new")
        ? "[is-new=true]"
        : "",
      arr = this.libraryContainer.querySelectorAll(
        `.music-item${isSearching}${isLikedOnly}${isNewOnly}`
      ),
      objArr = [];

    arr.forEach((item) => {
      objArr.push(item.referencedObj);
    });

    return objArr;
  }

  chooseRandObj() {
    return this.musicObjArr[
      Math.floor(Math.random() * this.musicObjArr.length)
    ];
  }
}
