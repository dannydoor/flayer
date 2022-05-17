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

    if (!recordStack) this.record.append(recordStack);
    if (!queue) this.queue.append(queue);
    this.statusIndicator.setAttribute("data-sync", queueStatus);
    this.clearButton.onclick = this._clearRecord;
  }

  _reservoirBuilder(contextArr = []) {
    // 큐가 조작되지 않은채 라이브러리 재생 중에는 null;
    if (typeof contextArr != "Array")
      throw new TypeError("매개변수가 배열로 주어져야 합니다");

    this.queueReservoir = new DocumentFragment();

    contextArr.forEach((item) => {
      let elem = document.createElement("div", { is: "queue-item" });
      elem.setup(item.musicObj, item.context);
      this.queueReservoir.append(elem);
    });
  }

  /* mapManager(item, method = "set") {
    let key = item.key;

    switch (method) {
      case "set":
        setter();
        break;
      case "delete":
        deleter();
        break;
      case "check":
        let isExisting = this._musicMap.has(key);
        return isExisting;
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
  } */

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
  }

  onReorder(elem, newNextElem) {
    let origNextElem = elem.nextElementSibling;
    if (origNextElem == newNextElem) return;

    if (this.queueStatus) this.updateQueueStatus(false);

    let elemIndex = elem.index;
    let nextIndex = newNextElem.index;

    if (!this.queueReservoir) {
      // 저장고가 비워져있을 경우 큐를 복사해서 새로 만들어줌.
      this.queueReservoir = new DocumentFragment();
      let clonedQueue = this.queue.cloneNode(true);
      this.queueReservoir.append(clonedQueue);
    }

    let reservoirElem = this.queueReservoir.querySelector(
      `[index=${elemIndex}]`
    );
    let reservoirNext = this.queueReservoir.querySelector(
      `[index=${nextIndex}]`
    );

    newNextElem.before(elem);
    reservoirNext.before(reservoirElem);

    this.updateController();
  }

  shuffleQueue() {}

  restoreQueue() {
    this._clearQueue();
    let clonedReservoir = this.queueReservoir.cloneNode(true);
    this.queue.append(clonedReservoir);
  }

  playThis(obj, context) {
    let isExistedOneKept = false;

    if (!this.queueStatus) {
      let howToHandleExistingQueue = modalManager.createModal("queue-play");
      if (howToHandleExistingQueue == "canceled") return;
      else if (howToHandleExistingQueue == "clear") {
        this.updateQueueStatus(true);
        this._clearQueue();
      } else if (howToHandleExistingQueue == "keep") {
        isExistedOneKept = true;
      }
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
      this.queueReservoir = null;
      controller.playMusic();
      return;
    } else {
      let contextMusics = playlistManager.getPlaylistContents(context);
      this._applyToQueue(contextMusics, context);
      if (controller.isShuffled) this._shuffleQueue();
      controller.playMusic();
      return;
    }
  }

  playQueue(elem) {
    controller.updateMusicToPlay(elem);
    controller.updateTooltip(true, true, true);
    this.setPlaylistName();
  }

  makeUpLibraryItem() {
    let isLibrary =
      this._contextChecker(controller.currentInfo.context) === "library";
    let doesNeedMakeUp = !controller.prevMusic || !controller.nextMusic;

    if (!isLibrary || !doesNeedMakeUp || !this.queueStatus) return;

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

      target.before(newPrevMusic);
    }

    function addAfter(obj) {
      let newNextMusic = document.createElement("div", { is: "queue-item" });
      newNextMusic.setup(obj, "Library");

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
    // whole 파라미터에 따라 일부분만 섞을 수도, 다 섞어버릴 수도 있음.
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
    let newRecordElem = document.createElement("div", { is: "library-item" });
    newRecordElem.setup(obj, true);
    this.record.append(newRecordElem);
  }
}
