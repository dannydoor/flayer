class QueueManager {
  constructor(
    queueStatus = true,
    recordStack = null,
    queueRepo = null,
    queue = null,
    map = null
  ) {
    // 큐 요소와 프로퍼티 대응
    this.record = window["record-stack"];
    this.queue = window["queue-content"];
    this.statusIndicator = window["queue-status"];
    this.clearButton = window["clear-record"];
    this.currPlaylistName = window["curr-playlist-name"];
    this.queueRepo = queueRepo.cloneNode(true);
    this.queueStatus = queueStatus;

    // 메소드 바인딩
    QueueManager.playNext = QueueManager.playNext.bind(this);
    QueueManager.playLater = QueueManager.playLater.bind(this);
    QueueManager.playThis = QueueManager.playThis.bind(this);
    QueueManager.playQueue = QueueManager.playQueue.bind(this);
    QueueManager.playRecord = QueueManager.playRecord.bind(this);
    QueueManager.applyPlaylistChanges =
      QueueManager.applyPlaylistChanges.bind(this);
    QueueManager.setPlaylistName = QueueManager.setPlaylistName.bind(this);
    QueueManager.shuffleQueue = QueueManager.shuffleQueue.bind(this);
    QueueManager.restoreQueue = QueueManager.restoreQueue.bind(this);
    QueueManager.pushRecordStack = QueueManager.pushRecordStack.bind(this);
    QueueManager.makeUpLibraryItem = QueueManager.makeUpLibraryItem.bind(this);
    QueueManager.deleteQueueItem = QueueManager.deleteQueueItem.bind(this);
    QueueManager._onReorder = QueueManager._onReorder.bind(this);
    this._mapManager = this._mapManager.bind(this);
    this._clearQueue = this._clearQueue.bind(this);
    this._clearBeforeAfter = this._clearBeforeAfter.bind(this);
    this._clearRecord = this._clearRecord.bind(this);
    this._applyToQueue = this._applyToQueue.bind(this);
    this._chooseRandom = this._chooseRandom.bind(this);
    this._shuffleQueue = this._shuffleQueue.bind(this);

    // 마지막 세션 적용
    this._musicMap = map || new Map();
    if (recordStack) this.record.append(recordStack);
    if (queue) this.queue.append(queue);
    recordStack = null;
    queue = null;
    this._updateQueueStatus(queueStatus);

    let scrollHeight = parseInt(
      getComputedStyle(window["record-stack"]).height
    );
    let timerId = setTimeout(() => {
      document.querySelector(".simplebar-content-wrapper").scrollTop =
        scrollHeight + 56;
    }, 200);

    // 핸들러 달기 및 slip.js 적용
    this.statusIndicator.onmouseover = this._onMouseOverTooltip;
    this.statusIndicator.onmouseleave = this._onMouseLeaveTooltip;
    this.clearButton.onclick = this._clearRecord.bind(this);
    this._setupQueueSlip();
  }

  static get currentMusic() {
    return window["queue-content"].querySelector(".current");
  }

  static get queueFirstChild() {
    return window["queue-content"].firstElementChild;
  }

  static get queueLastChild() {
    return window["queue-content"].lastElementChild;
  }

  // public 메소드
  static playNext(info, context, isShuffled = false, startId = null) {
    if (this.queueStatus) this._updateQueueStatus(false);

    let currentMusicInQueue = QueueManager.currentMusic;
    let currentIndex = currentMusicInQueue.index;
    let currentMusicInRepo = this.queueRepo.querySelector(
      `[index="${currentIndex}"]`
    );
    let tempFragment = new DocumentFragment();

    if (Array.isArray(info)) {
      info.forEach((obj) => {
        let elem = this._itembuilder(obj, context);
        tempFragment.append(elem);
      });
    } else {
      let elem = this._itembuilder(info, context);
      tempFragment.append(elem);
    }

    currentMusicInRepo.after(tempFragment.cloneNode(true));

    if (isShuffled) {
      let arr = Array.from(tempFragment);
      for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random * (i - 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      arr.forEach((item) => tempFragment.append(item));
    } else {
    }

    if (startId) {
      // 플레이리스트로부터 처음으로 재생할 음악의 id를 전달받아 이를 첫번째 요소로 올림.
      let nextMusic = tempFragment.querySelector(`[music-id="${startId}"]`);
      tempFragment.prepend(nextMusic);
      currentMusicInQueue.after(tempFragment);

      controller.nextButton.click();

      tempFragment = null;
      return;
    }

    currentMusicInQueue.after(tempFragment);
    tempFragment = null;
    return;
  }

  static playLater(info, context) {
    if (this.queueStatus) this._updateQueueStatus(false);

    let tempFragment = new DocumentFragment();

    if (Array.isArray(info)) {
      info.forEach((obj) => {
        let elem = this._itembuilder(obj, context);
        tempFragment.append(elem);
      });
    } else {
      let elem = this._itembuilder(info, context);
      tempFragment.append(elem);
    }

    this.queueRepo.append(tempFragment.cloneNode(true));
    this.queue.append(tempFragment);
    tempFragment = null;
    return;
  }

  static applyPlaylistChanges(
    fullList = null,
    context,
    changes = { added: [], deleted: [] }
  ) {
    let newCurrent;
    let isCurrentDeleted = false;
    let currentId = QueueManager.currentMusic.musicId;
    newCurrentFinder = newCurrentFinder.bind(this);
    currentDeletionChecker = currentDeletionChecker.bind(this);
    clearQueueData = clearQueueData.bind(this);

    if (this.queueStatus) {
      // 큐 저장소가 온전히 플레이리스트의 것.
      this._repositoryBuilder(fullList, context);
      let [deleteList] = currentDeletionChecker();
      let newId = newCurrentFinder(true, deleteList);

      if (!controller.isShuffled) {
        clearQueueData();
        this.queue.append(this.queueRepo.cloneNode(true));
      } else {
        let idArr = [];
        Array.prototype.forEach.call(this.queue.children, (item) => {
          idArr.push(item.musicId);
        });

        clearQueueData();

        idArr.forEach((id) => {
          // 기존의 큐 추가(제거된 건 패스됨)
          let itemToClone = this.queueRepo.querySelector(`[music-id="${id}"]`);
          if (itemToClone) {
            this.queue.append(itemToClone.cloneNode(true));
          } else {
          }
        });

        changes.added.forEach((obj) => {
          // 추가된 곡 추가
          let objId = obj.id;
          let itemToClone = this.queueRepo.querySelector(
            `[music-id="${objId}"]`
          );
          this.queue.append(itemToClone.cloneNode(true));
        });
      }

      if (!newId) {
        newCurrent = QueueManager.queueFirstChild;
      } else {
        newCurrent = this.queue.querySelector(`[music-id="${newId}"]`);
      }
    } else {
      // 큐 저장소와 플레이리스트의 연결이 해제됨.
      changes.added.forEach((obj) => {
        let elem = this._itembuilder(obj, context);
        this.queueRepo.append(elem);
        this.queue.append(elem.cloneNode(true));
      });

      let [deleteList, deleteListRepo] = currentDeletionChecker();

      deleteList.forEach((item) => {
        this._mapManager(item.musicObj, "delete");
        item.remove();
      });
      deleteListRepo.forEach((item) => item.remove());

      let foundCurrentElem = newCurrentFinder(false, deleteList);
      if (!foundCurrentElem) newCurrent = QueueManager.queueFirstChild;
    }

    Controller.updateMusicToPlay(newCurrent);
    Controller.updateTooltip(true);

    function newCurrentFinder(isNew = false, deleteList = []) {
      // isNew는 큐가 갈아엎어졌는지를 알려줌
      if (isCurrentDeleted) {
        let gotcha = false;
        let targetElem = QueueManager.currentMusic;

        while (!gotcha) {
          if (!targetElem) break;
          else {
            if (deleteList.includes(targetElem)) {
              targetElem = targetElem.nextElementSibling;
            } else {
              gotcha = true;
            }
          }
        }

        if (!gotcha) return undefined; // 현재 음악을 포함해 뒤 음악도 다 제거됨.

        if (isNew) {
          return targetElem.musicId;
        } else {
          newCurrent = targetElem;
          newCurrent.classList.add("current");
          return true;
        }
      } else {
        if (isNew) return currentId;
        else {
          newCurrent = QueueManager.currentMusic;
          return true;
        }
      }
    }

    function currentDeletionChecker() {
      let deleteList = [];
      let deleteListRepo = [];
      changes.deleted.forEach((obj) => {
        let objId = obj.id;
        let itemToDelete = this.queue.querySelectorAll(
          `[music-id="${objId}"][context="${context}"]`
        );
        itemToDelete.forEach((item) => {
          deleteList.push(item);
        });

        itemToDelete = this.queueRepo.querySelectorAll(
          `[music-id="${objId}"][context="${context}"]`
        );
        itemToDelete.forEach((item) => {
          deleteListRepo.push(item);
        });
      });

      if (deleteList.includes(QueueManager.currentMusic)) {
        isCurrentDeleted = true;
      }

      return [deleteList, deleteListRepo];
    }

    function clearQueueData() {
      Array.prototype.forEach.call(this.queue.children, (item) => {
        this._mapManager(item.musicObj, "delete");
      });
      this._clearQueue();
    }
  }

  static shuffleQueue() {
    if (!this.queueRepo) {
      // 온전히 라이브러리 재생 중이라는 뜻.
      this._clearBeforeAfter();
      QueueManager.makeUpLibraryItem();
      return;
    } else {
      if (!controller.isRepeat) {
        this._shuffleQueue(false);
      } else {
        this._shuffleQueue(true);
        this.queue.prepend(QueueManager.currentMusic);
      }
    }
  }

  static restoreQueue() {
    if (!this.queueRepo) {
      // 온전히 라이브러리 재생 중이라는 뜻.
      this._clearBeforeAfter();
      QueueManager.makeUpLibraryItem();
      return;
    } else {
      let currentIndex = QueueManager.currentMusic.index;
      this._clearQueue();
      this.queue.append(this.queueRepo.cloneNode(true));
      this.queue
        .querySelector(`[index="${currentIndex}"]`)
        .classList.add("current");
    }
  }

  static playThis(obj, context) {
    let isExistingKept = false;
    clearQueue = clearQueue.bind(this);
    let isLibrary = context.startsWith("library");

    if (!this.queueStatus) {
      let howToHandleExistingQueue = modalManager.createModal("queue-play");
      // 모달 매니저가 기존의 재생 대기열을 비울 건지에 대한 모달을 띄우고 대답을 기다리는 프로미스를 생성 후 대답 반환.
      if (howToHandleExistingQueue == "canceled") {
        return;
      } else if (howToHandleExistingQueue == "clear") {
        clearQueue();
        this._updateQueueStatus(true);
      } else if (howToHandleExistingQueue == "keep") {
        isExistingKept = true;
      }
    } else {
      clearQueue();
    }

    if (isExistingKept) {
      if (isLibrary) {
        // 라이브러리 요소의 경우 그 음악만 나중에 재생.
        QueueManager.playNext(obj, context);
        controller.nextButton.click();
        return;
      } else {
        // 플레이리스트는 컨텍스트의 음악을 한꺼번에 나중에 재생.
        let contextMusics = playlistManager.getPlaylistContents(context);
        QueueManager.playNext(
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
    document.querySelectorAll(".current").forEach((item) => {
      item.classList.remove("current");
    });

    if (isLibrary) {
      let nextObj;

      if (!controller.isShuffled) {
        nextObj = libraryManager.getNextObj(obj.id); // 라이브러리 매니저가 정렬 조건에 따라 알아서 골라줌.
      } else {
        nextObj = this._chooseRandom();
      }

      let arr = [obj, nextObj];
      this._applyToQueue(arr, context);
      this.queueRepo = null; // 라이브러리는 저장소를 따로 만들지 않음.
    } else {
      let currentId = obj.id;
      let contextMusics = playlistManager.getPlaylistContents(context);

      this._applyToQueue(contextMusics, context);
      if (controller.isShuffled) this._shuffleQueue(true);
      let currentMusic = this.queue.querySelector(`[music-id="${currentId}"]`);
      this.queue.prepend(currentMusic);
    }

    Controller.playMusic();

    function clearQueue() {
      Array.prototype.forEach.call(this.queue.children, (elem) => {
        this._mapManager(elem.musicObj, "delete");
      });

      this._clearQueue();
    }
  }

  static playQueue(elem) {
    Controller.updateMusicToPlay(elem);
    Controller.updateTooltip(true, true);
    QueueManager.setPlaylistName();
  }

  static playRecord(obj) {
    QueueManager.playNext(obj, "record");
    controller.nextButton.click();
  }

  static makeUpLibraryItem() {
    return;
    let isLibrary = controller.currentInfo.context.startsWith("library");
    let doesNeedMakeUp = !controller.prevMusic || !controller.nextMusic;
    addBefore = addBefore.bind(this);
    addAfter = addAfter.bind(this);

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

    function addBefore(obj) {
      let newPrevMusic = this._itembuilder(obj);
      target.before(newPrevMusic);
    }

    function addAfter(obj) {
      let newNextMusic = this._itembuilder(obj);
      target.after(newNextMusic);
    }
  }

  static pushRecordStack(obj) {
    let newRecordElem = document.createElement("div", { is: "record-item" });
    newRecordElem.setup(obj);
    this.record.append(newRecordElem);
  }

  static setPlaylistName() {
    let name = playlistManager.getPlaylistName(controller.currentInfo.context);

    if (name) {
      this.currPlaylistName.innerHTML = name;
    } else {
      this.currPlaylistName.innerHTML = "";
    }
  }

  static deleteQueueItem(elem) {
    this._updateQueueStatus(false);
    let isCurrent = elem.classList.contains("current");
    let needUpdate =
      elem.previousElementSibling.classList.contains("current") ||
      elem.nextElementSibling.classList.contains("current");

    let elemIndex = elem.index;
    let elemInRepo = this.queueRepo.querySelector(`[index="${elemIndex}"]`);
    console.log(elemInRepo);
    this._mapManager(elem.musicObj, "delete");
    elem.remove();
    if (elemInRepo) {
      elemInRepo.remove();
    }

    if (isCurrent) {
      controller.nextButton.click();
    } else {
    }

    if (needUpdate) {
      Controller.updateByQueueChange();
    } else {
    }
  }

  // private 메소드

  _repositoryBuilder(info, context) {
    // 큐가 조작되지 않은채 라이브러리 재생 중에는 null;
    this.queueRepo = new DocumentFragment();

    if (Array.isArray(info)) {
      info.forEach((obj) => {
        let elem = this._itembuilder(obj, context);
        this.queueRepo.append(elem);
      });
    } else {
      let elem = this._itembuilder(obj, context);
      this.queueRepo.append(elem);
    }
  }

  _mapManager(obj, method = "set") {
    let key = obj.id;
    setter = setter.bind(this);
    deleter = deleter.bind(this);

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

  _clearRecord() {
    let sureToDelete = modalManager.createModal("clear-record");
    // 모달 매니저가 진짜로 기록을 삭제할 건지 모달을 띄우고 사용자의 대답을 받는 프로미스를 생성, 대답을 반환.
    if (!sureToDelete) return;
    this.record.innerHTML = "";
  }

  _clearQueue() {
    this.queue.innerHTML = "";
  }

  _setupQueueSlip() {
    this.queue.addEventListener("slip:beforeswipe", function (e) {
      e.preventDefault();
    });

    this.queue.addEventListener("slip:beforewait", function (e) {
      if (e.target.classList.contains("music-drag")) e.preventDefault();
      else {
      }
    });

    this.queue.addEventListener("slip:reorder", function (e) {
      QueueManager._onReorder(e.target, e.detail.insertBefore);
    });

    new Slip(this.queue);
  }

  static _onReorder(elem, newNextElem) {
    let origNextElem = elem.nextElementSibling;
    if (origNextElem == newNextElem) return;
    else {
      if (this.queueStatus) this._updateQueueStatus(false);
      newNextElem.before(elem);
      Controller.updateByQueueChange();
    }
  }

  _clearBeforeAfter() {
    while (QueueManager.currentMusic.nextElementSibling) {
      // 다음 음악 비우기
      let target = controller.correntMusic.nextElementSibling;
      this._mapManager(target.musicObj, "delete");
      target.remove();
    }

    while (QueueManager.currentMusic.previousElementSibling) {
      // 이전 음악 비우기
      let target = controller.correntMusic.previousElementSibling;
      this._mapManager(target.musicObj, "delete");
      target.remove();
    }
  }

  _applyToQueue(info, context) {
    this._repositoryBuilder(info, context);
    this.queue.append(this.queueRepo.cloneNode(true));
  }

  _chooseRandom() {
    // 라이브러리에서 무작위로 골라 큐에 없는 곡을 반환하는 메소드.
    let arr = libraryManager.musicObjArr;
    let length = arr.length;
    let gotcha = false;
    let randObj;

    while (!gotcha) {
      let target = arr[Math.floor(Math.random * length)];
      if (this._mapManager(target, "check")) {
        continue;
      } else {
        gotcha = true;
        randObj = target;
      }
    }

    return randObj;
  }

  _shuffleQueue(whole = true) {
    // 실질적으로 섞는 메소드.
    let shuffleFragment = new DocumentFragment();

    if (whole) {
      while (this.queue.firstElementChild) {
        shuffleFragment.append(this.queue.firstElementChild);
      }
    } else {
      while (controller.currentMusic.nextElementSibling) {
        shuffleFragment.append(controller.correntMusic.nextElementSibling);
      }
    }

    let shuffleArr = Array.from(shuffleFragment.children);
    // 피셔-예이츠 알고리즘
    for (let i = shuffleArr.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [shuffleArr[i], shuffleArr[j]] = [shuffleArr[j], shuffleArr[i]];
    }

    shuffleArr.forEach((item) => {
      this.queue.append(item);
    });

    // documentFragment를 지우기.
    shuffleFragment = null;
  }

  _updateQueueStatus(bool) {
    this.queueStatus = bool;
    if (bool) {
      this.statusIndicator.classList.add("active");
    } else {
      this.statusIndicator.classList.remove("active");
    }

    if (!bool) {
      if (!this.queueRepo) {
        // 저장고가 비워져있을 경우 큐를 복사해서 새로 만들어줌.
        this.queueRepo = new DocumentFragment();
        this.queueRepo.append(this.queue.cloneNode(true));
      }
    } else {
    }
  }

  _itembuilder(obj, context) {
    if (!obj) return;
    let elem = document.createElement("div", { is: "queue-item" });
    elem.setup(obj, context);
    this._mapManager(obj, "set");
    return elem;
  }

  _onMouseOverTooltip(e) {
    let target = e.target;
    target.timerId = setTimeout(() => makeTooltipVisible(), 1000);

    function makeTooltipVisible() {
      target.querySelectorAll(".tooltip").forEach((tooltip) => {
        tooltip.classList.add("visible");
      });
    }
  }

  _onMouseLeaveTooltip(e) {
    let target = e.target;
    clearTimeout(target.timerId);
    target.timerId = null;
    target.querySelectorAll(".tooltip").forEach((tooltip) => {
      tooltip.classList.remove("visible");
    });
  }
}
