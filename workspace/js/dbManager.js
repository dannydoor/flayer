// 브라우저의 localStorage 관리.

class DbManager {
  constructor() {
    DbManager.db = {};
    DbManager.getSortedArr = DbManager.getSortedArr.bind(this);
    DbManager.searchSet = new Set();
    DbManager.searchSpace = undefined;
    DbManager.ls = {
      playlistTable: undefined,
      libSortMode: undefined,
      playSortMode: undefined,
      currObj: undefined,
      currContext: undefined,
      shuffle: undefined,
      repeat: undefined,
      mute: undefined,
      record: undefined,
      queue: undefined,
      queueRepo: undefined,
      map: undefined,
      queueState: true,
      updatedDate: undefined,
      isDark: undefined,
    };

    this.reg = /\[New\]\s/g;
    this.toRelease = [];

    if (localStorage.lastSession) {
      this.lastSessionImporter();
      this.toggleDarkTheme();
      this.defineManagers(true);
    } else {
      this.dbBuilder();
      this.defineManagers(false);
    }

    window.addEventListener("beforeunload", this.lastSessionExporter);
  }

  lastSessionImporter() {
    let lastSession = JSON.parse(localStorage.lastSession);

    DbManager.db = lastSession.objTable;
    [
      DbManager.ls.currObj,
      DbManager.ls.currContext,
      DbManager.ls.shuffle,
      DbManager.ls.repeat,
      DbManager.ls.mute,
      DbManager.ls.libSortMode,
    ] = [
      DbManager.db[lastSession.currentInfo?.id],
      lastSession.currentInfo?.context,
      lastSession.currentInfo.isShuffled,
      lastSession.currentInfo.isRepeat,
      lastSession.currentInfo.isMuted,
      lastSession.currentInfo.sortMode,
    ];

    let recordArr = [];
    let queueArr = [];
    let queueRepoArr = [];

    lastSession.queueInfo.record.forEach((item) => {
      let elem = document.createElement("div", { is: "record-item" });
      elem.setup(DbManager.db[item]);
      recordArr.push(elem);
    });
    lastSession.queueInfo.queue.forEach((item) => {
      let elem = document.createElement("div", { is: "queue-item" });
      elem.setup(DbManager.db[item.id], item.context);
      queueArr.push(elem);
    });
    lastSession.queueInfo.queueRepo.forEach((index) => {
      let elem = queueArr[index].cloneNode(true);
      queueRepoArr.push(elem);
    });

    if (queueArr[lastSession.queueInfo.currentIndex]) {
      queueArr[lastSession.queueInfo.currentIndex].classList.add("current");
    }

    let recordFragment = new DocumentFragment();
    let queueFragment = new DocumentFragment();
    let queueRepoFragment = new DocumentFragment();
    recordArr.forEach((elem) => recordFragment.append(elem));
    queueArr.forEach((elem) => queueFragment.append(elem));
    queueRepoArr.forEach((elem) => queueRepoFragment.append(elem));

    let map = new Map();
    lastSession.queueInfo.map.forEach((item) => {
      map[item[0]] = item[1];
    });

    [
      DbManager.ls.record,
      DbManager.ls.queue,
      DbManager.ls.queueRepo,
      DbManager.ls.map,
      DbManager.ls.queueState,
    ] = [
      recordFragment,
      queueFragment,
      queueRepoFragment,
      map,
      lastSession.queueInfo.queueState,
    ];

    [DbManager.ls.playlistTable, DbManager.ls.playSortMode] = [
      lastSession.playlistInfo?.table,
      lastSession.playlistInfo?.sort,
    ];

    DbManager.ls.updatedDate = lastSession.updatedDate;
    DbManager.ls.isDark = lastSession.isDark;
  }

  lastSessionExporter() {
    let lastSession = {};

    if (controller.currentInfo.reference) {
      controller.currentInfo.reference.isPlaying = false;
    }

    lastSession.objTable = DbManager.db;
    lastSession.currentInfo = {
      id: controller.currentInfo?.id,
      context: controller.currentInfo?.context,
      isShuffled: controller.isShuffled,
      isRepeat: controller.isRepeat,
      isMuted: controller.isMuted,
      sortMode: libraryManager.sortMode,
    };

    let record = [];
    let queue = [];
    let queueTable = {};
    let queueRepo = [];
    let currentIndex = null;
    let currentState = queueManager.queueState;

    Array.from(queueManager.record.children).forEach((item) =>
      record.push(item.getAttribute("music-id"))
    );
    Array.from(queueManager.queue.children).forEach((item, index) => {
      if (item.classList.contains("current")) currentIndex = index;
      queue.push({
        id: item.getAttribute("music-id"),
        context: item.getAttribute("context"),
      });
      queueTable[item.getAttribute("index")] = index;
    });

    if (queueManager.queueRepo) {
      Array.from(queueManager.queueRepo.children).forEach((item) => {
        queueRepo.push(queueTable[item.getAttribute("index")]);
      });
    }

    let map = Array.from(queueManager._musicMap.entries());

    lastSession.queueInfo = {
      record: record,
      queue: queue,
      queueRepo: queueRepo,
      currentIndex: currentIndex,
      map: map,
      queueState: currentState,
    };

    lastSession.playlistInfo = {
      table: playlistManager.table,
      sort: playlistManager.sortMode,
    };

    lastSession.updatedDate = window["db-upload-date"].innerHTML;
    lastSession.isDark = window["dark-mode-switch"].dataset.state;

    localStorage.lastSession = JSON.stringify(lastSession);
  }

  defineManagers(ls) {
    window["db-upload-date"].innerHTML =
      DbManager.ls.updatedDate == "undefined" ? "*" : DbManager.ls.updatedDate;
    if (ls) {
      queueManager = new QueueManager(
        DbManager.ls.queueState,
        DbManager.ls.record,
        DbManager.ls.queueRepo,
        DbManager.ls.queue,
        DbManager.ls.map
      );
      libraryManager = new LibraryManager(DbManager.ls.libSortMode);
      playlistManager = new PlaylistManager(
        DbManager.ls.playlistTable,
        DbManager.ls.playSortMode
      );
      controller = new Controller(
        DbManager.ls.currObj,
        DbManager.ls.currContext,
        DbManager.ls.shuffle,
        DbManager.ls.repeat,
        DbManager.ls.mute
      );
    } else {
      queueManager = new QueueManager();
      libraryManager = new LibraryManager();
      playlistManager = new PlaylistManager();
      controller = new Controller();
    }
    popupManager = new PopupManager();
    tabManager = new TabManager();
    contextmenuManager = new ContextmenuManager();
    librarySearchElem = new SearchElem("library");
    selectableSearchElem = new SearchElem("selectable");
  }

  dbBuilder() {
    db.forEach((arr) => {
      let newObj = this._builder(arr);
      DbManager.db[newObj.id] = newObj;
    });
  }

  static getSortedArr() {
    let obj = DbManager.db;
    let arr1 = [];
    let arr2, arr4;
    for (let key in obj) {
      if (!key.endsWith("#") && !obj[key].isHided) {
        arr1.push(obj[key]);
      }
    }
    let arr3 = arr1.slice();

    arr1.sort(compareTitle);
    arr2 = arr1.slice().reverse();
    arr3.sort(compareArtist);
    arr4 = arr3.slice().reverse();

    return [arr1, arr2, arr3, arr4];

    function compareTitle(obj1, obj2) {
      let title1 = strFormatter(obj1["title"]);
      let title2 = strFormatter(obj2["title"]);
      let artist1 = strFormatter(obj1["artist"]);
      let artist2 = strFormatter(obj2["artist"]);
      return !!title1.localeCompare(title2)
        ? title1.localeCompare(title2)
        : artist1.localeCompare(artist2);
    }

    function compareArtist(obj1, obj2) {
      let title1 = strFormatter(obj1["title"]);
      let title2 = strFormatter(obj2["title"]);
      let artist1 = strFormatter(obj1["artist"]);
      let artist2 = strFormatter(obj2["artist"]);
      return !!artist1.localeCompare(artist2)
        ? artist1.localeCompare(artist2)
        : title1.localeCompare(title2);
    }
  }

  _updateDb(db) {
    let obj = DbManager.db,
      tempSet = new Set();
    db.forEach((arr) => {
      let title = this.reg.test(arr[0]) ? arr[0].replace(this.reg, "") : arr[0];
      let key = hash(title + arr[4]);

      tempSet.add(key, true);

      if (obj[key] !== undefined) {
        obj[key].title == arr[0];
        obj[key].artist == arr[1];
        obj[key].startTime = arr[2];
        obj[key].endTime = arr[3];
        obj[key].duration = parseInt(arr[3] - arr[2]);
        obj[key].isNew = false;
      } else if (obj[key + "#"]) {
        // 플레이리스트를 불러오는 과정에서 들어온 커스텀 db
        obj[key] = obj[key + "#"];
        delete obj[key + "#"];

        obj[key].title == arr[0];
        obj[key].artist == arr[1];
        obj[key].startTime = arr[2];
        obj[key].endTime = arr[3];
        obj[key].duration = parseInt(arr[3] - arr[2]);
        obj[key].isNew = true;
      } else {
        let newObj = this._builder(arr);
        obj[key] = newObj;
        obj[key].isNew = true;
      }
    });
    for (let key in DbManager.db) {
      if (tempSet.has(key) || key.endsWith("#")) return;
      else {
        DbManager.db[key + "#"] = DbManager.db[key];
        delete DbManager.db[key];
      }
    }
    tempSet = null;
  }

  updateDb() {
    onSuccess = onSuccess.bind(this);

    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", ".js");
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
      let reg1 = /const db = /;
      let reg2 = /,\s+]/g;
      text = text.replace(reg1, "");
      text = text.replace(reg2, "]");
      text = text.replace(/;/g, "");
      console.log(text);

      let arr = JSON.parse(text);
      this._updateDb(arr);

      let date = new Date(),
        dateStr = date.toLocaleString("ko-kr");

      window["db-upload-date"].innerHTML = dateStr;

      PopupManager.createModal("updated");
    }
  }

  exportLs() {
    this.lastSessionExporter();
    let text = localStorage.lastSession;

    saveFile(JSON.stringify(text));

    async function saveFile(text) {
      let myBlob = new Blob([text], { type: "application/json" });

      const fileHandle = await window.showSaveFilePicker({
        types: [
          {
            description: "Flaylist Data",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      const fileStream = await fileHandle.createWritable();

      await fileStream.write(myBlob);
      await fileStream.close();
    }
  }

  importLs() {
    onSuccess = onSuccess.bind(this);

    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", ".json");
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
      let json = JSON.parse(text);

      localStorage.lastSession = json;
      window.removeEventListener("beforeunload", this.lastSessionExporter);

      PopupManager.createModal("updated");
    }
  }

  resetLs() {
    localStorage.lastSession = "";
    window.removeEventListener("beforeunload", this.lastSessionExporter);

    PopupManager.createModal("updated");
  }

  releaseHided() {
    if (!this.toRelease.length) return;
    else {
      this.toRelease.forEach((id) => {
        DbManager.db[id].isHided = false;
      });
      this.toRelease = [];
    }
  }

  _builder(arr) {
    let obj = {},
      isNew = this.reg.test(arr[0]);
    obj.title = isNew ? arr[0].replace(this.reg, "") : arr[0];
    obj.artist = arr[1];
    obj.startTime = arr[2];
    obj.endTime = arr[3];
    obj.duration = parseInt(obj.endTime - obj.startTime);
    obj.src = arr[4];
    obj.isLiked = false;
    obj.isPlaying = false;
    obj.isNew = isNew;
    obj.id = hash(obj.title + obj.src);
    obj.playedCounts = 0;
    obj.isHided = false;

    return obj;
  }

  hideElem(id) {
    ContextmenuManager.returnToStorehouse();
    DbManager.db[id].isHided = true;

    if (
      DbManager.db[id].isPlaying &&
      queueManager.queue.childElementCount == 1
    ) {
      Controller.stop();
    } else if (DbManager.db[id].isPlaying) {
      window["next-button"].click();
    }

    let musics = document.querySelectorAll(`[music-id="${id}"]`);
    musics.forEach((item) => {
      let isPlaylist = item.classList.contains("playlist"),
        playlist = item.closest(".tab-container");
      item.remove();
      if (isPlaylist) playlist.updateIndex();
    });

    // fragment 안에 있는 것도 지우기
    libraryManager.sortedFragment.forEach((fragment) => {
      let elem = fragment.querySelector(`[music-id="${id}"]`);
      elem?.remove();
    });
    playlistManager.selectableManager.sortedFragment.forEach((fragment) => {
      let elem = fragment.querySelector(`[music-id="${id}"]`);
      elem?.remove();
    });
    queueManager.queueRepo
      ?.querySelectorAll(`[music-id="${id}"]`)
      .forEach((item) => {
        item.remove();
      });

    libraryManager.updateDisplayedCounts();
    playlistManager.selectableManager.updateDisplayedCounts();
    QueueManager.makeUpLibraryItem();
  }

  toggleDarkTheme(bool = DbManager.ls.isDark) {
    if (bool == "on") {
      document.body.classList.add("dark-mode");
      window["dark-mode-switch"].setAttribute("data-state", "on");
    } else {
      document.body.classList.remove("dark-mode");
      window["dark-mode-switch"].setAttribute("data-state", "off");
    }
  }
}
