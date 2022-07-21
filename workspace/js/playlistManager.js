/*
 * 플레이리스트 생성, 편집, 정렬을 관리
 *
 *
 */

class PlaylistManager {
  constructor(playlistObjTable = {}, sortMode = 2) {
    this.listElem = window["playlist-list-container"];
    this.addElem = window["add-container"];
    this.createBtn = this.listElem.querySelector(".create-new");
    this.addCreateBtn = this.addElem.querySelector(".create-new");
    this.sortBtns = document.querySelectorAll(".playlist-sort-btn");
    this.toAddSongs = [];
    this.sortMode = sortMode;
    this.table = playlistObjTable === undefined ? {} : playlistObjTable;
    const storehouse = window["element-storehouse"];

    for (let key in playlistObjTable) {
      let obj = playlistObjTable[key];
      let elem = document.createElement("div", { is: "playlist-content" });
      elem.setup(obj);
      storehouse.append(elem);
    }

    {
      let sortType = this.sortMode % 2,
        sortTarget = Math.floor(this.sortMode / 2) - 1,
        sortOpt = window["playlist-sort-opt"];

      sortOpt.firstElementChild.children[sortType].classList.add("checked");
      sortOpt.lastElementChild.children[sortTarget].classList.add("checked");
      this.updateListSortMode();
    }

    // 바인딩
    PlaylistManager.addToPlaylist = PlaylistManager.addToPlaylist.bind(this);

    // 핸들러 달기
    this.createBtn.onclick = (e) => {
      e.stopPropagation();
      let elem = e.target.closest(".playlist-item");
      ContextmenuManager.addContextmenu(elem, "playlist-create-opt");
    };

    this.addCreateBtn.onclick = (e) => {
      e.stopPropagation();
      let elem = e.target.closest(".playlist-item");
      ContextmenuManager.addContextmenu(elem, "playlist-create-opt-add");
    };

    this.addElem.querySelector(".cancel-button").onclick = () => {
      playlistManager?._cancelAdding();
    };
    this.sortBtns.forEach((elem) => {
      elem.onclick = (e) => {
        e.stopPropagation();
        ContextmenuManager.addContextmenu(e.target, "playlist-sort-opt");
      };
    });

    this.selectableManager = new PlaylistSelectableManager(DbManager.db);
    this.editManager = new PlaylistEditManager();
  }

  static addToPlaylist(...args) {
    this.toAddSongs = args;
    TabManager.showContent("add-container");
    TabManager.showContent("backdrop");
  }

  createNewPlaylist(name, desc, arr) {
    let obj = {};
    obj.arr = arr;
    obj.name = name;
    obj.desc = desc;
    obj.date = Date.now();
    obj.lastPlayed = 0;

    let id = hash(name + Math.round(Date.now() * Math.random()));
    obj.id = id;

    this.table[id] = obj;

    let elem = document.createElement("div", { is: "playlist-content" });
    elem.setup(obj);
    window["element-storehouse"].append(elem);
    window["open-playlist"].click();
    TabManager.showContent(id);
  }

  deletePlaylist(id) {
    ContextmenuManager.returnToStorehouse();
    QueueManager.deletePlaylist(id);
    delete this.table[id];
    window[id].remove();
    document
      .querySelectorAll(`[playlist-id="${id}"]`)
      .forEach((item) => item.remove());
  }

  exportPlaylist(id) {
    let targetObj = this.table[id],
      obj = {
        name: targetObj.name,
        desc: targetObj.desc,
        arr: targetObj.arr.map((key) => {
          let obj = {};
          Object.assign(obj, DbManager.db[key]);
          delete obj.isLiked;
          delete obj.isPlaying;
          delete obj.isNew;
          delete obj.playedCounts;
          return obj;
        }),
      };

    saveFile(JSON.stringify(obj));

    async function saveFile(text) {
      let myBlob = new Blob([text], { type: "text/plain" });

      const fileHandle = await window.showSaveFilePicker({
        types: [
          {
            description: "Flaylist file",
            accept: { "text/plain": [".flay"] },
          },
        ],
      });
      const fileStream = await fileHandle.createWritable();

      await fileStream.write(myBlob);
      await fileStream.close();
    }
  }

  importPlaylist(isAdding = false) {
    onSuccess = onSuccess.bind(this);

    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", ".flay");
    input.onchange = () => {
      readFile(input);
      input.remove();
    };
    input.click();

    function readFile(input) {
      let file = input.files[0];

      let reader = new FileReader();

      reader.readAsText(file);

      reader.onload = () => onSuccess(reader.result);
      reader.onerror = () => console.log(reader.error);
    }

    function onSuccess(text) {
      let obj = JSON.parse(text),
        name = obj.name,
        dupId = undefined;
      obj.id = undefined;

      obj.arr = obj.arr.map((obj) => {
        let id = obj.id;
        if (DbManager.db[id]) return id;
        else {
          if (DbManager.db[id + "#"]) return id + "#";
          else {
            obj.id = id + "#";
            obj.isNew = false;
            obj.isLiked = false;
            obj.isPlaying = false;
            obj.isHided = false;
            DbManager.db[id + "#"] = obj;
            return obj.id;
          }
        }
      });

      for (let key in this.table) {
        if (this.table[key].name == name) {
          dupId = this.table[key].id;
        }
      }

      if (dupId) {
        let merge = confirm(
          "이름이 동일한 플레이리스트가 있습니다. 덮어쓰시겠습니까?"
        );
        if (merge) {
          window[dupId].update(obj.name, obj.desc, obj.arr);
          this.editManager.buildEditElement(this.table[dupId]);
        } else {
          this.editManager.buildEditElement(obj);
        }
      } else {
        this.editManager.buildEditElement(obj);
      }

      if (isAdding) this._addToEditor();
    }
  }

  _addToEditor() {
    // 플레이리스트에 추가 기능 중 플레이리스트를 새로 만들었을 때 편집창에 해당 음악 추가
    this.editManager.addSongs(...this.toAddSongs);
    this.toAddSongs = [];

    TabManager.hideFloat("add-container");

    if (tab.contains(window["queue-container"]) && tab.childElementCount != 3) {
      TabManager.hideFloat("queue-container");
      window["open-queue"].classList.remove("active");
    }
    TabManager.hideFloat("backdrop");
  }

  _addToPlaylistDirectly(id) {
    // 플레이리스트에 추가 기능으로 해당 플레이리스트에 바로 음악 추가
    let obj = this.table[id],
      addedArr = [],
      dupl = false;

    this.toAddSongs.forEach((id) => {
      if (obj.arr.includes(id)) dupl = true;
      else {
        obj.arr.push(id);
        addedArr.push(id);
      }
    });
    this.toAddSongs = [];

    window[id].update(obj.name, obj.desc, obj.arr);
    QueueManager.applyPlaylistChanges(
      obj.arr.map((key) => DbManager.db[key]),
      "playlist:" + id,
      { added: addedArr, deleted: [] }
    );

    if (dupl) PopupManager.createModal("playlist-add");

    TabManager.hideFloat("add-container");
    if (tab.contains(window["queue-container"]) && tab.childElementCount != 2) {
      TabManager.showContent("queue-container");
      queueManager.updateScroll();
    } else {
      TabManager.hideFloat("backdrop");
    }

    PopupManager.createToast("added");
  }

  _cancelAdding() {
    // 플레이리스트에 추가 기능 중 취소 시
    this.toAddSongs = [];

    TabManager.hideFloat("add-container");
    if (tab.contains(window["queue-container"]) && tab.childElementCount != 3) {
      TabManager.showContent("queue-container");
      queueManager.updateScroll();
    } else {
      TabManager.hideFloat("backdrop");
    }
  }

  updateListSortMode(param = this.sortMode) {
    // 플레이리스트 목록 정렬 업데이트
    let isAscending = !(param % 2),
      listItems = this.listElem.querySelector(".items"),
      addItems = this.addElem.querySelector(".items"),
      arr1 = Array.from(listItems.children),
      arr2 = Array.from(addItems.children);

    switch (Math.floor(param / 2)) {
      case 1: {
        arr1.sort(compareName);
        arr2.sort(compareName);
        break;
      }
      case 2: {
        arr1.sort(compareDate);
        arr2.sort(compareDate);
        break;
      }
      case 3: {
        arr1.sort(compareLastPlayed);
        arr2.sort(compareLastPlayed);
        break;
      }
    }

    this.sortMode = param;

    arr1.forEach((item) => {
      this.listElem.querySelector(".items").append(item);
    });
    arr2.forEach((item) => {
      this.addElem.querySelector(".items").append(item);
    });

    function compareName(a, b) {
      let name1 = a.getAttribute("playlist-name"),
        name2 = b.getAttribute("playlist-name");

      return isAscending
        ? name1.localeCompare(name2)
        : -name1.localeCompare(name2);
    }

    function compareDate(a, b) {
      let date1 = a.getAttribute("playlist-date"),
        date2 = b.getAttribute("playlist-date");

      return isAscending ? date2 - date1 : date1 - date2;
    }

    function compareLastPlayed(a, b) {
      let last1 = a.getAttribute("last-played"),
        last2 = b.getAttribute("last-played");

      return isAscending ? last2 - last1 : last1 - last2;
    }
  }

  getPlaylistContents(context) {
    if (!context) return;
    if (context.startsWith("playlist:")) {
      let arr = this.table[context.slice(9)].arr;
      return arr.map((key) => DbManager.db[key]);
    } else return [];
  }

  getPlaylistName(context) {
    if (!context) return;
    if (context.startsWith("playlist:"))
      return this.table[context.slice(9)].name;
    return null;
  }
}

class PlaylistSelectableManager {
  // 플레이리스트 편집 창에서 음악 추가시 나타나는 창 관리. 라이브러리 매니저와 대동소이.
  constructor(objHashTable, sortMode = 0) {
    this.musicObjArr = [];
    for (let key in objHashTable) {
      this.musicObjArr.push(objHashTable[key]);
    }

    // 검색 및 정렬 초기화
    this.sortMode = sortMode;

    this.sortedArr = [[], [], [], []];
    [
      this.sortedArr[0],
      this.sortedArr[1],
      this.sortedArr[2],
      this.sortedArr[3],
    ] = DbManager.getSortedArr(objHashTable);
    this.sortedFragment = [];
    this.sortedKeyTable = [{}, {}, {}, {}];
    this.sortedValueTable = [{}, {}, {}, {}];

    for (let i = 0; i < 4; i++) {
      this.sortedFragment.push(new DocumentFragment());
      this.sortedArr[i].forEach((item, index) => {
        this.sortedKeyTable[i][item.id] = index;
        this.sortedValueTable[i][index] = item;

        let elem = document.createElement("div", { is: "selectable-item" });
        elem.setup(item);
        this.sortedFragment[i].append(elem);
      });
    }

    this.container = window["selectable-container"];
    this.headerTitle = this.container.querySelector(".header-title");
    this.containerContent = window["selectable-content"];
    this.containerContent.append(
      this.sortedFragment[this.sortMode].cloneNode(true)
    );
    this.initSortOpt();

    this.updateDisplayedCounts();

    // 핸들러 달기
    window["selectable-search-opt-btn"].onclick =
      this.selectableBtnHandler("search");
    window["selectable-sort-btn"].onclick = this.selectableBtnHandler("sort");
    this.container.querySelector(".cancel-button").onclick = () => {
      this.initSelectedState();
    };
    window["selectable-add-btn"].onclick = () => {
      let isSearching = this.container.classList.contains("searching")
          ? ".searched"
          : "",
        isLikedOnly = this.container.classList.contains("only-liked")
          ? "[is-liked=true]"
          : "",
        isNewOnly = this.container.classList.contains("only-new")
          ? "[is-new=true]"
          : "";

      let arr = this.container.querySelectorAll(
        `.music-item${isSearching}${isLikedOnly}${isNewOnly}`
      );

      arr.forEach((item) => {
        let id = item.getAttribute("music-id");
        if (!this.toAdd.includes(id)) {
          this.toAdd.push(id);
          item.classList.add("selected");
        }
      });

      this.updateSelectedNum();
    };

    this.container.querySelector(".cancel-button").onclick = () => {
      this.initSelectedState();

      TabManager.hideFloat("selectable-container");
      TabManager.hideFloat("backdrop");
    };
    this.container.querySelector(".commit-button").onclick = () => {
      playlistManager.editManager.addSongs(...this.toAdd);
      this.initSelectedState();

      TabManager.hideFloat("selectable-container");
      TabManager.hideFloat("backdrop");
    };

    // 추가할 곡 배열 및 선택 상태 초기화
    this.initSelectedState();
  }

  initSelectedState() {
    this.containerContent.querySelectorAll(".selected").forEach((item) => {
      item.classList.remove("selected");
    });
    this.toAdd = [];
    this.headerTitle.innerHTML = "추가할 곡 선택";
    this.container.querySelector(".clear-search").click();
  }

  toggleSelectedState(id) {
    if (this.toAdd.includes(id)) {
      this.toAdd.splice(this.toAdd.indexOf(id), 1);
      this.containerContent
        .querySelector(`[music-id="${id}"]`)
        .classList.remove("selected");
    } else {
      this.toAdd.push(id);
      this.containerContent
        .querySelector(`[music-id="${id}"]`)
        .classList.add("selected");
    }
    this.updateSelectedNum();
  }

  initSortOpt() {
    let sortOpt = window["selectable-sort-opt"];

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

  updateSortMode(param) {
    this.containerContent.innerHTML = "";

    if (param < 0) {
      param = -param;
    } else {
      param -= 2;
    }

    this.sortMode = param;
    this.containerContent.append(
      this.sortedFragment[this.sortMode].cloneNode(true)
    );
    this.toAdd.forEach((id) => {
      this.containerContent
        .querySelector(`[music-id="${id}"]`)
        .classList.add("selected");
    });

    window["selectable-search-field"].dispatchEvent(changeEvent);
  }

  updateSelectedNum() {
    let num = this.toAdd.length;
    if (num) {
      this.headerTitle.innerHTML = num + "곡 선택됨";
    } else {
      this.headerTitle.innerHTML = "추가할 곡 선택";
    }
  }

  selectableBtnHandler(type) {
    return (e) => {
      e.stopPropagation();

      let target = e.target.closest(".library-btn");

      if (target.querySelector(".contextmenu")) {
        ContextmenuManager.returnToStorehouse();
      } else {
        ContextmenuManager.addContextmenu(
          target,
          "selectable-" + type + "-opt"
        );
      }
    };
  }

  updateDisplayedCounts() {
    let isSearching = this.container.classList.contains("searching")
        ? ".searched"
        : "",
      isLikedOnly = this.container.classList.contains("only-liked")
        ? "[is-liked=true]"
        : "",
      isNewOnly = this.container.classList.contains("only-new")
        ? "[is-new=true]"
        : "";

    let counts = this.container.querySelectorAll(
      `.music-item${isSearching}${isLikedOnly}${isNewOnly}`
    ).length;

    window["selectable-displayed-counts"].innerHTML = counts;
  }

  startAdding() {
    TabManager.showContent("backdrop");
    TabManager.showContent("selectable-container");
  }
}

class PlaylistContent extends HTMLDivElement {
  // 플레이리스트 아이템 각각의 생성자.
  constructor() {
    super();
    this.id;
  }

  setup(obj) {
    this.id = obj.id;

    this.setAttribute("id", obj.id);
    this.classList.add("tab-container");
    this._builder(obj.arr, obj.name, obj.desc);

    let elem = document.createElement("div"),
      name = document.createElement("span");

    elem.classList.add("playlist-item", "item");
    name.classList.add("playlist-name");

    elem.setAttribute("playlist-id", obj.id);
    elem.setAttribute("playlist-name", obj.name);
    elem.setAttribute("playlist-date", obj.date);
    elem.setAttribute("last-played", obj.lastPlayed);
    name.innerHTML = obj.name;
    name.setAttribute("title", obj.name);
    elem.append(name);

    let addElem = elem.cloneNode(true);

    window["playlist-list-container"].querySelector(".items").append(elem);
    window["add-container"].querySelector(".items").append(addElem);

    elem.onclick = (e) => {
      let target = e.target.closest(".playlist-item");
      let id = target.getAttribute("playlist-id");

      TabManager.showContent(id);
    };
    addElem.onclick = (e) => {
      let target = e.target.closest(".playlist-item");
      let id = target.getAttribute("playlist-id");

      playlistManager._addToPlaylistDirectly(id);
    };

    playlistManager?.updateListSortMode();
  }

  update(name, desc, arr) {
    let isEmpty = !arr.length,
      obj = playlistManager?.table[this.id];
    [obj.name, obj.desc, obj.arr] = [name, desc, arr];

    let itemsElem = this.querySelector(".playlist-items"),
      nameElem = this.querySelector(".playlist-info > h2"),
      descElem = this.querySelector(".playlist-info > p"),
      listElems = document.querySelectorAll(`[playlist-id="${this.id}"] span`);

    itemsElem.innerHTML = "";

    obj.arr.forEach((id, index) => {
      let obj = DbManager.db[id];
      let elem = document.createElement("div", { is: "playlist-item" });
      elem.setup(obj, this.id, index + 1);
      itemsElem.append(elem);
    });

    nameElem.innerHTML =
      listElems[0].innerHTML =
      listElems[1].innerHTML =
        obj.name;
    listElems[0].setAttribute("title", obj.name);
    listElems[1].setAttribute("title", obj.name);
    descElem.innerHTML = obj.desc;

    if (obj.desc) {
      descElem.classList.remove("blank");
    } else {
      descElem.classList.add("blank");
    }

    this.switchBtn(isEmpty);
    this._updateFooter();
  }

  updateIndex() {
    let arr = Array.from(this.querySelectorAll(".music-item"));
    arr.forEach((item, index) => {
      item.updateIndex(index + 1);
    });

    this._updateFooter();
  }

  _builder(arr, name, desc) {
    // header
    let header = document.createElement("div"),
      meatballs = document.createElement("button"),
      closeBtn = document.createElement("button"),
      hideBtn = document.createElement("button");
    header.className = "header";
    meatballs.className = "meatballs";
    closeBtn.className = "close-button";
    hideBtn.className = "hide-button";
    header.append(meatballs, closeBtn, hideBtn);

    // content
    let content = document.createElement("div"),
      scrollable = document.createElement("div");
    content.className = "content";
    scrollable.className = "scrollable";
    content.append(scrollable);

    // 플레이리스트 정보
    let infoElem = document.createElement("div"),
      nameElem = document.createElement("h2"),
      descElem = document.createElement("p");
    infoElem.className = "playlist-info";
    nameElem.innerHTML = name;
    descElem.innerHTML = desc;
    infoElem.append(nameElem, descElem);
    if (!desc) {
      descElem.className = "blank";
    }

    // 플레이리스트 음악
    let itemsElem = document.createElement("div");
    itemsElem.className = "playlist-items";
    arr.forEach((id, index, arr) => {
      let obj = DbManager.db[id];
      if (obj?.isHided || (!obj && !DbManager.db[id + "#"])) return;
      else if (!obj && DbManager.db[id + "#"]) {
        // 커스텀 db엔 있는 경우
        arr[index] = id + "#";
      } else if (!obj && DbManager.db[id.slice(-1)]) {
        // 커스텀 db 내용물이었으나, 정식 내용물이 된 경우.
        arr[index] = id.slice(-1);
      }

      let elem = document.createElement("div", { is: "playlist-item" });
      elem.setup(obj, this.id, index + 1);
      itemsElem.append(elem);
    });

    // 푸터
    let footer = document.createElement("div");
    footer.className = "playlist-footer";

    scrollable.append(infoElem, itemsElem, footer);

    new SimpleBar(scrollable);

    let isEmpty = !itemsElem.children.length;

    this.append(header, content);
    this.switchBtn(isEmpty);
    this._updateFooter();
    this.updateIndex();

    // 핸들러 추가
    hideBtn.onclick = (e) => {
      let id = e.target.closest(".tab-container").getAttribute("id");
      TabManager.hideContent(id);
    };

    closeBtn.onclick = () => {
      TabManager.hideAll();
    };

    meatballs.onclick = (e) => {
      e.stopPropagation();
      let target = e.target.closest(".meatballs");
      ContextmenuManager.addContextmenu(target, "playlist-opt");
    };
  }

  playHandler() {
    Controller.switchShuffleState(false);
    let target = this.querySelector(".playlist-items").firstElementChild;

    if (!target) return;

    QueueManager.playThis(target.referencedObj, target.context);
  }

  shuffleHandler() {
    let itemsElem = this.querySelector(".playlist-items");

    Controller.switchShuffleState(true);
    let rand = Math.floor(itemsElem.childElementCount * Math.random()),
      target = Array.from(itemsElem.children)[rand];

    if (!target) return;

    QueueManager.playThis(target.referencedObj, target.context);
  }

  addSongs() {
    // 플레이리스트가 비워져 있을 때 바로 노래를 추가할 수 있는 편집창을 전시하는 메소드.
    let id = this.id,
      obj = playlistManager.table[id];
    playlistManager?.editManager?.buildEditElement(obj);
    playlistManager?.selectableManager?.startAdding();
  }

  switchBtn(isEmpty = false) {
    // 플레이리스트 내용물 상태에 따라 버튼을 교체.
    if (isEmpty) {
      this.querySelector(".playlist-btns")?.remove();
      if (this.querySelector(".add-songs")) return;

      let newBtn = document.createElement("button");

      newBtn.className = "add-songs";
      newBtn.onclick = this.addSongs.bind(this);

      this.querySelector(".playlist-info")?.after(newBtn);
    } else {
      this.querySelector(".add-songs")?.remove();
      if (this.querySelector(".playlist-btns")) return;

      let btnsElem = document.createElement("div"),
        playBtn = document.createElement("button"),
        shuffleBtn = document.createElement("button");

      btnsElem.className = "playlist-btns";
      playBtn.className = "play";
      shuffleBtn.className = "shuffle";

      playBtn.onclick = this.playHandler.bind(this);
      shuffleBtn.onclick = this.shuffleHandler.bind(this);

      btnsElem.append(playBtn, shuffleBtn);
      this.querySelector(".playlist-info")?.after(btnsElem);
    }
  }

  _updateFooter() {
    let arr = Array.from(this.querySelectorAll(".music-item"));
    let num = arr.length;
    let footer = this.querySelector(".playlist-footer");
    if (!num) {
      footer.innerHTML = "";
      return;
    }

    let duration = arr.map((item) => item.getAttribute("duration"));
    duration = duration.reduce((sum, current) => sum + parseInt(current), 0);

    let [hours, mins] = [
      parseInt(duration / 3600),
      parseInt(duration / 60) % 60,
    ];
    hours = hours > 0 ? hours + "시간 " : "";
    mins = mins + "분";

    let str = "총 " + num + "곡 ・ " + hours + mins;

    this.querySelector(".playlist-footer").innerHTML = str;
  }
}

class PlaylistEditManager {
  // 플레이리스트 편집창 관리
  constructor() {
    this.fullList = null;
    this.changes = {
      added: [],
      deleted: [],
    };
    this.targetId = undefined;
    this.isNew = undefined;

    this.container = window["edit-container"];
    this.nameSlot = this.container.querySelector(".input-name");
    this.descSlot = this.container.querySelector(".input-desc");
    this.itemSlot = this.container.querySelector(".edit-items");
    this.cancelBtn = this.container.querySelector(".cancel-button");
    this.commitBtn = this.container.querySelector(".commit-button");
    this.addBtn = this.container.querySelector(".add-new-songs");

    this.cancelBtn.onclick = () => PopupManager.createModal("cancel");
    this.commitBtn.onclick = () => this.commitEditing();
    this.addBtn.onclick = () => playlistManager.selectableManager.startAdding();
    this.nameSlot.onkeydown = this.descSlot.onkeydown = (e) =>
      e.stopPropagation();
    this.nameSlot.onkeyup = this.descSlot.onkeyup = (e) => {
      if (e.code == "Enter") {
        e.target.value = e.target.value.slice(0, -1);
      } else if (
        e.target.value.length > parseInt(e.target.getAttribute("max-length"))
      ) {
        e.target.value = e.target.value.slice(0, -2);
      }
    };

    this.itemSlot.addEventListener("slip:beforeswipe", function (e) {
      e.preventDefault();
    });

    this.itemSlot.addEventListener("slip:beforewait", function (e) {
      if (e.target.classList.contains("music-drag")) e.preventDefault();
    });

    this.itemSlot.addEventListener("slip:reorder", function (e) {
      const container = e.target.closest(".edit-items"),
        origNext = e.target.nextElementSibling;
      let newNext = e.detail.insertBefore;
      if (origNext == newNext) return;
      else {
        if (newNext) {
          newNext.before(e.target);
        } else {
          newNext = container.lastElementChild;
          newNext.after(e.target);
        }
      }
    });

    new Slip(this.itemSlot);
  }

  addSongs(...args) {
    let dupl = false;

    args.forEach((id) => {
      if (this.itemSlot.querySelector(`[music-id="${id}"]`)) {
        dupl = true;
      } else {
        if (this.changes.deleted.includes(id)) {
          this.changes.deleted.splice(this.changes.deleted.indexOf(id), 1);
        } else {
          this.changes.added.push(id);
        }

        let elem = document.createElement("div", { is: "editing-item" });
        elem.setup(DbManager.db[id]);

        this.itemSlot.append(elem);
      }
    });

    if (dupl) PopupManager.createModal("playlist-add");
  }

  deleteSong(elem) {
    let id = elem.getAttribute("music-id");

    if (this.changes.added.includes(id)) {
      this.changes.added.splice(this.changes.added.indexOf(id), 1);
    } else {
      this.changes.deleted.push(id);
    }

    elem.remove();
  }

  deleteSongExternal(elem) {
    // 편집창을 통하지 않고 컨텍스트메뉴를 통해 제거할 경우 호출되는 메소드
    ContextmenuManager.returnToStorehouse();

    let musicId = elem.getAttribute("music-id");
    this.targetId = elem.closest(".tab-container").id;
    this.fullList = playlistManager.table[this.targetId].arr;

    this.fullList.splice(musicId, 1);
    this.changes.deleted.push(musicId);

    elem.remove();
    window[this.targetId].updateIndex();

    QueueManager.applyPlaylistChanges(
      this.fullList.map((key) => DbManager.db[key]),
      "playlist:" + this.targetId,
      this.changes
    );
    this._initChanges();
  }

  buildEditElement(obj) {
    if (obj === undefined)
      obj = {
        name: "",
        desc: "",
        arr: [],
        id: undefined,
      };

    let [name, desc, arr, id] = [obj.name, obj.desc, obj.arr, obj.id];
    this.targetId = id;
    this.isNew = id === undefined ? true : false;

    this.nameSlot.value = name;
    this.descSlot.value = desc;

    arr.forEach((id) => {
      let obj = DbManager.db[id];
      if (obj.isHided) return;

      let elem = document.createElement("div", { is: "editing-item" });
      elem.setup(obj);
      this.itemSlot.append(elem);
    });

    TabManager.showContent("edit-container");
    tabManager.isEditing = true;
  }

  discardEditing() {
    this._initChanges();
    tabManager.isEditing = false;
    TabManager.hideContent("edit-container");
  }

  commitEditing() {
    if (this.nameSlot.value.trim().length < 2) {
      PopupManager.createModal("alert");
      return;
    }
    tabManager.isEditing = false;

    if (this.descSlot.value.trim().length == 0) {
      this.descSlot.value = "";
    }

    this.fullList = Array.from(this.itemSlot.children).map((item) =>
      item.getAttribute("music-id")
    );
    if (this.isNew) {
      playlistManager.createNewPlaylist(
        this.nameSlot.value,
        this.descSlot.value,
        this.fullList
      );
    } else {
      window[this.targetId].update(
        this.nameSlot.value,
        this.descSlot.value,
        this.fullList
      );
      QueueManager.applyPlaylistChanges(
        this.fullList.map((key) => DbManager.db[key]),
        "playlist:" + this.targetId,
        this.changes
      );
    }

    this._initChanges();
    TabManager.hideContent("edit-container");
  }

  _initChanges() {
    // 초기화
    this.fullList = null;
    this.changes = {
      added: [],
      deleted: [],
    };
    this.targetId = undefined;
    this.isNew = undefined;

    this.nameSlot.innerHTML = "";
    this.descSlot.innerHTML = "";
    this.nameSlot.value = "";
    this.descSlot.value = "";
    this.itemSlot.innerHTML = "";
  }
}

customElements.define("playlist-content", PlaylistContent, { extends: "div" });
