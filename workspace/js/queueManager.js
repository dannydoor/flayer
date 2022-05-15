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

    if (!recordStack) this.record.append(recordStack);
    if (!queue) this.queue.append(queue);
    this.statusIndicator.setAttribute("data-sync", queueStatus);
    this.clearButton.onclick = this._clearRecord;
  }

  _reservoirBuilder(contextArr = []) {
    if (typeof contextArr != "Array")
      throw new Error("매개변수가 배열로 주어져야 합니다");

    this.queueReservoir = new DocumentFragment();

    contextArr.forEach((item) => {
      let elem = document.createElement("div", { is: "queue-item" });
      elem.setup(item.obj, item.context);
      this.queueReservoir.append(elem);
    });
  }

  addAfterQueue(obj, context) {}

  _clearRecord() {}

  getFirstInfo() {
    let first = this.queue.firstElementChild;
    if (!first) return [null, null, null];
    else return [first, first.musicObj, first.context];
  }

  getPrevInfo() {
    let prev = this.queue.querySelector(".prev");
    if (!prev) return [null, null, null];
    else return [prev, prev.musicObj, prev.context];
  }

  getNextInfo() {
    let next = this.queue.querySelector(".next");
    if (!next) return [null, null, null];
    else return [next, next.musicObj, next.context];
  }

  isPlayingElementFirst() {
    let playing = this.queue.querySelector(".playing");
    let first = this.queue.firstElementChild;
    return playing == first;
  }

  clearQueue() {
    this.queue.children.forEach((child) => {
      child.remove();
    });
  }

  shuffleQueue() {}

  restoreQueue() {
    this.clearQueue();
    let clonedReservoir = this.queueReservoir.cloneNode(true);
    this.queue.append(clonedReservoir);
    this.correctAttribute();
  }

  playThis(obj, context) {
    let isExistedOneKept = false;

    if (!this.queueStatus) {
      let howToHandleExistingQueue = modalManager.createModal("queue-play");
      if (howToHandleExistingQueue == "canceled") return;
      else if (howToHandleExistingQueue == "clear") {
        this.updateQueueStatus(true);
        this.clearQueue();
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

    controller.referencedObj.isPlaying = false;
    document.querySelectorAll(".playing").forEach((item) => {
      item.classList.remove("playing");
    });
    document.querySelector(".current").classList.remove("current");

    if (this._contextChecker(context) == "library") {
      let nextObj;
      if (!controller.isShuffled) {
        nextObj = libraryManager.getNextMusic(obj);
      } else {
        nextObj = this._chooseRandom();
      }
      let arr = [obj, nextObj];
      this._applyToQueue(arr, context);
      controller.playMusic();
      return;
    } else {
      let contextMusics = playlistManager.getContextList(context);
      this._applyToQueue(contextMusics, context);
      if (controller.isShuffled) this._shuffleQueue();
      controller.playMusic();
      return;
    }
  }

  playQueue() {
    // 큐 아이템 클릭 시.... 음...
  }

  _applyToQueue(obj, context) {
    this._reservoirBuilder(obj, context);
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
      : null;
  }

  _setPlaylistName() {
    let playing = this.queue.querySelector(".playing");

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

  pushRecordStack(obj) {
    let newRecordElem = document.createElement("div", { is: "library-item" });
    newRecordElem.setup(obj, true);
    this.record.append(newRecordElem);
  }

  correctAttribute() {}
}
