class QueueManager {
  constructor(
    recordStack = null,
    queueReservoir = null,
    queue = null,
    queueStatus = true
  ) {
    this.record = document.querySelector("#record-stack");
    this.queue = document.querySelector("#queue-content");
    this.statusIndicator = document.querySelector("#queue-status");
    this.clearButton = document.querySelector("#clear-record");
    this.currPlaylistName = document.querySelector("#curr-playlist-name");
    this.queueReservoir = queueReservoir;
    this.queueStatus = queueStatus;
    this._clearRecord = this._clearRecord.bind(this);
    this.onReorder = this.onReorder.bind(this);
    this.makeUpLibraryItem = this.makeUpLibraryItem.bind(this);
    this.mapManager = this.mapManager.bind(this);
    this._musicMap = new Map();

    if (!recordStack) this.record.append(recordStack);
    if (!queue) this.queue.append(queue);
    this.statusIndicator.setAttribute("data-sync", queueStatus);
    this.clearButton.onclick = this._clearRecord;

    this.setupQueueSlip();
  }

  _reservoirBuilder(contextArr = []) {
    // 큐가 조작되지 않은채 라이브러리 재생 중에는 null;
    if (typeof contextArr != "Array")
      throw new TypeError("매개변수가 배열로 주어져야 합니다");

    this.queueReservoir = new DocumentFragment();

    contextArr.forEach((item) => {
      let elem = document.createElement("div", { is: "queue-item" });
      elem.setup(item.musicObj, item.context);
      this.mapManager(item.musicObj, "set");
      this.queueReservoir.append(elem);
    });
  }

  mapManager(obj, method = "set") {
    let key = obj.id;

    switch (method) {
      case "set":
        setter();
        break;
      case "delete":
        deleter();
        break;
      case "check":
        return this._musicMap.has(key);
      default:
        return;
    }
    return;

    function setter() {
      let num = this._musicMap.get(key);
      if (!num) this._musicMap.set(key, 1);
      else this._musicMap.set(key, ++num);
    }

    function deleter() {
      let num = this._musicMap.get(key);
      if (num > 1) this._musicMap.set(key, --num);
      else this._musicMap.delete(key);
    }
  }

  addToRightNext(obj, context) {}

  _clearRecord() {
    let sureToDelete = modalManager.createModal("clear-record");
    if (!sureToDelete) return;
    this.record.innerHTML = "";
  }

  _clearQueue() {
    this.queue.innerHTML = "";
  }

  setupQueueSlip() {
    this.queue.addEventListener("slip:beforeswipe", function (e) {
      e.preventDefault();
    });

    this.queue.addEventListener("slip:swipe", function (e) {
      e.preventDefault();
    });

    this.queue.addEventListener("slip:beforewait", function (e) {
      if (e.target.classList.contains("music-drag")) e.preventDefault();
    });

    this.queue.addEventListener("slip:reorder", function (e) {
      this.onReorder(e.target, e.detail.insertBefore);
    });

    new Slip(this.queue);
  }

  onReorder(elem, newNextElem) {
    let origNextElem = elem.nextElementSibling;
    if (origNextElem == newNextElem) return;

    if (this.queueStatus) this.updateQueueStatus(false);

    if (!this.queueReservoir) {
      // 저장고가 비워져있을 경우 큐를 복사해서 새로 만들어줌.
      this.queueReservoir = new DocumentFragment();
      let clonedQueue = this.queue.cloneNode(true);
      this.queueReservoir.append(clonedQueue);
    }

    newNextElem.before(elem);

    this.updateController();
  }

  clearBeforeAfter() {
    while (controller.currentMusic.nextElementSibling) {
      // 다음 음악 비우기
      let target = controller.correntMusic.nextElementSibling;
      this.mapManager(target.musicObj, "delete");
      target.remove();
    }

    while (controller.currentMusic.prevElementSibling) {
      // 이전 음악 비우기
      let target = controller.correntMusic.prevElementSibling;
      this.mapManager(target.musicObj, "delete");
      target.remove();
    }
  }

  shuffleQueue() {
    if (!this.queueReservoir) {
      // 온전히 라이브러리 재생 중이라는 뜻.
      this.clearBeforeAfter();
      this.makeUpLibraryItem();
      return;
    }

    if (!controller.isRepeat) {
      this._shuffleQueue(false);
    } else {
      this._shuffleQueue(true);
      let currentMusic = this.queue.querySelector(".current");
      this.queue.prepend(currentMusic);
      controller.currentMusic = currentMusic;
    }

    this.updateController();
  }

  restoreQueue() {
    if (!this.queueReservoir) {
      // 온전히 라이브러리 재생 중이라는 뜻.
      this.clearBeforeAfter();
      this.makeUpLibraryItem();
      return;
    }

    let currentIndex = this.queue.querySelector(".current").index;
    this._clearQueue();
    let clonedReservoir = this.queueReservoir.cloneNode(true);
    this.queue.append(clonedReservoir);
    this.queue
      .querySelector(`[index=${currentIndex}]`)
      .classList.add("current");
    controller.currentMusic = this.queue.querySelector(".current");
    this.updateController();
  }

  playThis(obj, context) {
    let isExistedOneKept = false;

    if (!this.queueStatus) {
      let howToHandleExistingQueue = modalManager.createModal("queue-play");
      if (howToHandleExistingQueue == "canceled") return;
      else if (howToHandleExistingQueue == "clear") {
        Array.prototype.forEach.call(this.queue.children, (elem) => {
          this.mapManager(elem.musicObj, "delete");
        });
        this.updateQueueStatus(true);
        this._clearQueue();
      } else if (howToHandleExistingQueue == "keep") {
        isExistedOneKept = true;
      }
    } else {
      Array.prototype.forEach.call(this.queue.children, (elem) => {
        this.mapManager(elem.musicObj, "delete");
      });
      this._clearQueue();
    }

    if (isExistedOneKept) {
      if (this._contextChecker(context) == "library") {
        // 라이브러리 요소의 경우 그 음악만 나중에 재생.
        this.addToRightNext(obj, context);
        controller.nextButton.click();
        return;
      } else {
        // 플레이리스트는 컨텍스트의 음악을 한꺼번에 나중에 재생.
        let contextMusics = playlistManager.getContextList(context);
        this.addToRightNext(
          contextMusics,
          context,
          controller.isShuffled,
          obj.id
        );
        return;
      }
    }

    controller.currentInfo.reference.isPlaying = false;
    document.querySelectorAll(".playing").forEach((item) => {
      item.classList.remove("playing");
    });
    controller.currentMusic.classList.remove("current");

    if (this._contextChecker(context) == "library") {
      let nextObj;

      if (!controller.isShuffled) {
        nextObj = libraryManager.getNextObj(obj.id); // 라이브러리 매니저가 정렬 조건에 따라 알아서 골라줌.
      } else {
        nextObj = this._chooseRandom();
      }

      let arr = [obj, nextObj];
      this._applyToQueue(arr, context);
      this.queueReservoir = null; // 라이브러리는 저장고를 따로 만들지 않음.

      controller.playMusic();
      return;
    } else {
      let currentId = obj.id;
      let contextMusics = playlistManager.getPlaylistContents(context);

      this._applyToQueue(contextMusics, context);
      if (controller.isShuffled) this._shuffleQueue(true);
      let currentMusic = this.queue.querySelector(`[music-id=${currentId}]`);
      this.queue.prepend(currentMusic);

      controller.playMusic();
      return;
    }
  }

  playQueue(elem) {
    controller.updateMusicToPlay(elem);
    controller.updateTooltip(true, true, true);
    this.setPlaylistName();
  }

  playRecord(obj) {
    this.addToRightNext(obj, "record");
    controller.nextButton.click();
  }

  makeUpLibraryItem() {
    let isLibrary =
      this._contextChecker(controller.currentInfo.context) === "library";
    let doesNeedMakeUp = !controller.prevMusic || !controller.nextMusic;

    if (!isLibrary || !doesNeedMakeUp || this.queueStatus) return;

    let target = controller.currentMusic;
    let isShuffled = controller.isShuffled;

    if (isShuffled) {
      if (!controller.prevMusic) {
        let newPrevObj = this._chooseRandom();
        addBefore(newPrevObj);
      }
      if (!controller.nextMusic) {
        let newNextObj = this._chooseRandom();
        addAfter(newNextObj);
      }
    } else {
      if (!controller.prevMusic) {
        let newPrevObj = libraryManager.getPrevObj(target.musicId);
        addBefore(newPrevObj);
      }
      if (!controller.nextMusic) {
        let newNextObj = libraryManager.getNextObj(target.musicId);
        addAfter(newNextObj);
      }
    }

    this.updateController();

    function addBefore(obj) {
      let newPrevMusic = document.createElement("div", { is: "queue-item" });
      newPrevMusic.setup(obj, "Library");
      this.mapManager(newPrevMusic.musicObj, "set");

      target.before(newPrevMusic);
    }

    function addAfter(obj) {
      let newNextMusic = document.createElement("div", { is: "queue-item" });
      newNextMusic.setup(obj, "Library");
      this.mapManager(newNextMusic.musicObj, "set");

      target.after(newNextMusic);
    }
  }

  _applyToQueue(arr, context) {
    this._reservoirBuilder(arr, context);
    let clonedReservoir = this.queueReservoir.cloneNode(true);
    this.queue.append(clonedReservoir);
  }

  _chooseRandom() {
    // 라이브러리에서 무작위로 골라 큐에 없는 곡을 반환하는 메소드.
    let arr = libraryManager.musicObjArr;
    let length = arr.length;
    let caught = false;
    let randObj;

    while (!caught) {
      let target = arr[Math.floor(Math.random * length)];
      if (this.mapManager(target, "check")) {
        continue;
      } else {
        caught = true;
        randObj = target;
      }
    }

    return randObj;
  }

  _contextChecker(context) {
    return context.startsWith("Library")
      ? "library"
      : context.startsWith("Playlist")
      ? "playlist"
      : undefined;
  }

  setPlaylistName() {
    let playing = controller.currentMusic;

    if (!playing) return;

    let name = playlistManager.getPlaylistName(playing.context);

    if (name) {
      this.currPlaylistName.innerHTML = name;
    } else {
      this.currPlaylistName.innerHTML = "";
    }
  }

  _shuffleQueue(whole = true) {
    // 실질적으로 섞는 메소드.
    let shuffleTarget = new DocumentFragment();

    if (whole) {
      while (this.queue.firstElementChild) {
        shuffleTarget.append(this.queue.firstElementChild);
      }
    } else {
      while (controller.currentMusic.nextElementSibling) {
        shuffleTarget.append(controller.correntMusic.nextElementSibling);
      }
    }

    let shuffleArr = Array.from(shuffleTarget);
    // 피셔-예이츠 알고리즘
    for (let i = shuffleArr.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [shuffleArr[i], shuffleArr[j]] = [shuffleArr[j], shuffleArr[i]];
    }

    shuffleArr.forEach((item) => {
      this.queue.append(item);
    });

    // documentFragment를 지우기.
    shuffleTarget = null;
  }

  updateQueueStatus(bool) {
    this.queueStatus = bool;
    this.statusIndicator.setAttribute("data-sync", bool);
  }

  updateController() {
    controller.updatePrevAndNext();
    controller.updateTooltip(true, true);
  }

  pushRecordStack(obj) {
    let newRecordElem = document.createElement("div", { is: "record-item" });
    newRecordElem.setup(obj);
    this.record.append(newRecordElem);
  }
}
