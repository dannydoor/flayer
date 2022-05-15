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

  restoreQueue() {}

  playThis() {
    let isExistedOneKept = false;
    let tempReservoir = new DocumentFragment();

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
  }

  playQueue() {}

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
