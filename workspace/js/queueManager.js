class QueueManager {
  constructor(
    queueState = true,
    recordStack = null,
    queueRepo = null,
    queue = null,
    map = null
  ) {
    // 큐 요소와 프로퍼티 대응
    this.record = window["record-stack"];
    this.queue = window["queue-content"];
    this.stateIndicator = window["queue-state"];
    this.clearButton = window["clear-record"];
    this.currPlaylistName = window["curr-playlist-name"];
    if (queueRepo) {
      this.queueRepo = queueRepo.childElementCount
        ? queueRepo.cloneNode(true)
        : null;
    }
    this.queueState = queueState;
    this.tempObj = undefined;
    this.tempContext = undefined;

    // 메소드 바인딩
    QueueManager.moveNext = QueueManager.moveNext.bind(this);
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
    QueueManager.deletePlaylist = QueueManager.deletePlaylist.bind(this);
    QueueManager._onReorder = QueueManager._onReorder.bind(this);
    this._mapManager = this._mapManager.bind(this);
    this._clearQueue = this._clearQueue.bind(this);
    this._clearBeforeAfter = this._clearBeforeAfter.bind(this);
    this.clearRecord = this.clearRecord.bind(this);
    this._applyToQueue = this._applyToQueue.bind(this);
    this._chooseRandom = this._chooseRandom.bind(this);
    this._shuffleQueue = this._shuffleQueue.bind(this);

    // 마지막 세션 적용
    this._musicMap = map || new Map();
    if (recordStack) this.record.append(recordStack);
    if (queue) this.queue.append(queue);
    recordStack = null;
    queue = null;
    this._updateQueueState(queueState);

    setTimeout(() => {
      this.scrollWrapper = window["queue-container"].querySelector(
        ".simplebar-content-wrapper"
      );
      this.updateScroll();
    }, 300);

    // 핸들러 달기 및 slip.js 적용
    this.stateIndicator.onmouseover = this._onMouseOverTooltip;
    this.stateIndicator.onmouseleave = this._onMouseLeaveTooltip;
    this.currPlaylistName.ondblclick = () => {
      window["open-playlist"].click();
      TabManager.showContent(controller.currentInfo.context.slice(9));
    };
    this.clearButton.onclick = () => PopupManager.createModal("clear-record");
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
    if (this.queueState) this._updateQueueState(false);

    let currentMusicInQueue = QueueManager.currentMusic;
    let currentIndex = currentMusicInQueue?.index;
    let currentMusicInRepo = currentIndex
      ? this.queueRepo.querySelector(`[index="${currentIndex}"]`)
      : undefined;
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

    if (currentMusicInRepo) {
      currentMusicInRepo.after(tempFragment.cloneNode(true));
    } else {
      this.queueRepo.append(tempFragment.cloneNode(true));
    }

    if (isShuffled) {
      let arr = Array.from(tempFragment);
      shuffleHelper(arr);
      arr.forEach((item) => tempFragment.append(item));
    }

    if (startId) {
      // 플레이리스트로부터 처음으로 재생할 음악의 id를 전달받아 이를 첫번째 요소로 올림.
      let nextMusic = tempFragment.querySelector(`[music-id="${startId}"]`);
      if (isShuffled) tempFragment.prepend(nextMusic);

      if (currentMusicInQueue) {
        currentMusicInQueue.after(tempFragment);
      } else {
        this.queue.append(tempFragment);
        Controller.playMusic();
        return;
      }

      Controller.updateMusicToPlay(nextMusic);
      Controller.updateByQueueChange();

      tempFragment = null;

      // 토스트
      PopupManager.createToast("next");
      return;
    }

    if (currentMusicInQueue) {
      currentMusicInQueue.after(tempFragment);
    } else {
      this.queue.append(tempFragment);
      Controller.playMusic();
      return;
    }

    tempFragment = null;

    Controller.updateByQueueChange();
    this.updateScroll();

    // 토스트
    PopupManager.createToast("next");
    return;
  }

  static moveNext(elem) {
    if (!controller.isShuffled && this.queueState)
      this._updateQueueState(false);

    QueueManager.currentMusic.after(elem);
    Controller.updateByQueueChange();
    this.updateScroll();
  }

  static playLater(info, context) {
    if (this.queueState) this._updateQueueState(false);

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

    if (!QueueManager.currentMusic) {
      Controller.playMusic();
    }

    // 토스트
    PopupManager.createToast("later");
    return;
  }

  static applyPlaylistChanges(
    fullList = null,
    context,
    changes = { added: [], deleted: [] }
  ) {
    if (!this.queue.querySelector(`[context="${context}"]`)) return;
    let newCurrent;
    let isCurrentDeleted = false;
    let currentId = QueueManager.currentMusic.musicId;
    let isJustSwitched = !changes.added.length && !changes.deleted.length;
    newCurrentFinder = newCurrentFinder.bind(this);
    currentDeletionChecker = currentDeletionChecker.bind(this);
    clearQueueData = clearQueueData.bind(this);

    if (this.queueState) {
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

    if (!isJustSwitched && isCurrentDeleted)
      Controller.updateMusicToPlay(newCurrent);
    else {
      newCurrent.classList.add("current");
      Controller.updateByQueueChange();
    }
    this.updateScroll();

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
    this.updateScroll();
  }

  static restoreQueue() {
    if (!this.queueRepo) {
      // 온전히 라이브러리 재생 중이라는 뜻.
      this._clearBeforeAfter();
      QueueManager.makeUpLibraryItem();
      return;
    } else {
      let currentIndex = QueueManager.currentMusic.getAttribute("index");
      this._clearQueue();
      this.queue.append(this.queueRepo.cloneNode(true));
      this.queue
        .querySelector(`[index="${currentIndex}"]`)
        .classList.add("current");
    }
    this.updateScroll();
  }

  static playThis(obj, context) {
    this.tempObj = obj;
    this.tempContext = context;

    if (!this.queueState) {
      PopupManager.createModal("queue");
    } else {
      this.processMusicToPlay();
    }
  }

  static playQueue(elem) {
    Controller.updateMusicToPlay(elem);
    Controller.updateTooltip(true, true);
    QueueManager.setPlaylistName();
    this.updateScroll();
  }

  static playRecord(obj) {
    QueueManager.playNext(obj, "record");
    controller.nextButton.click();
    this.updateScroll();
  }

  static makeUpLibraryItem(isForced = false) {
    let isLibrary = controller.currentInfo?.context?.startsWith("library"),
      isPureLibrary = !this.queueRepo,
      isShuffled = controller.isShuffled,
      target = controller.currentMusic;
    addBefore = addBefore.bind(this);
    addAfter = addAfter.bind(this);

    if (isLibrary === undefined) return;

    if (isPureLibrary && isForced && !isShuffled) {
      this._clearBeforeAfter();
    }

    let noNext = target == QueueManager.queueLastChild,
      noPrev = target == QueueManager.queueFirstChild,
      needsMakeUp = noNext || noPrev;

    if (!isLibrary || !needsMakeUp || !this.queueState || !isPureLibrary)
      return;

    let targetId = target.getAttribute("music-id");

    if (isShuffled) {
      if (noPrev) {
        let newPrevObj = this._chooseRandom();
        addBefore(newPrevObj);
      }
      if (noNext) {
        let newNextObj = this._chooseRandom();
        addAfter(newNextObj);
      }
    } else {
      if (noPrev) {
        let newPrevObj = libraryManager.getPrevObj(targetId);
        if (newPrevObj) {
          addBefore(newPrevObj);
        } else {
          if (controller.isRepeat) {
            newPrevObj = libraryManager.getLastObj();
            addBefore(newPrevObj);
          } else {
          }
        }
      }
      if (noNext) {
        let newNextObj = libraryManager.getNextObj(targetId);
        if (newNextObj) {
          addAfter(newNextObj);
        } else {
          if (controller.isRepeat) {
            newNextObj = libraryManager.getFirstObj();
            addAfter(newNextObj);
          } else {
          }
        }
      }
    }

    function addBefore(obj) {
      let newPrevMusic = this._itembuilder(obj, "library");
      target.before(newPrevMusic);
    }

    function addAfter(obj) {
      let newNextMusic = this._itembuilder(obj, "library");
      target.after(newNextMusic);
    }
  }

  static pushRecordStack(obj) {
    if (obj.isHided) return;
    let newRecordElem = document.createElement("div", { is: "record-item" });
    newRecordElem.setup(obj);
    this.record.append(newRecordElem);
  }

  static setPlaylistName() {
    let context = controller?.currentInfo?.context
      ? controller.currentInfo.context
      : QueueManager.currentMusic?.context;

    let name = playlistManager.getPlaylistName(context);

    if (name) {
      this.currPlaylistName.innerHTML = name;
    } else {
      this.currPlaylistName.innerHTML = "";
    }
  }

  static deleteQueueItem(elem) {
    this._updateQueueState(false);
    let isCurrent = elem.classList.contains("current");
    let needUpdate =
      elem.previousElementSibling?.classList.contains("current") ||
      (elem.nextElementSibling
        ? elem.nextElementSibling.classList.contains("current")
        : false);

    let elemIndex = elem.index;
    let elemInRepo = this.queueRepo.querySelector(`[index="${elemIndex}"]`);
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

  static deletePlaylist(id) {
    let context = "playlist:" + id,
      arr = this.queue.querySelectorAll(`[context="${context}"]`),
      isCurrentIncluded = Array.from(arr).includes(QueueManager.currentMusic),
      noOtherMusic = this.queue.children.length == arr.length,
      prevQueueState = this.queueState;

    if (!arr.length) return;

    arr.forEach((item) => QueueManager.deleteQueueItem(item));
    this._updateQueueState(prevQueueState);

    if (isCurrentIncluded) {
      if (noOtherMusic) {
        Controller.stop();
      } else {
        Controller.updateMusicToPlay(QueueManager.queueFirstChild);
      }
    } else {
      Controller.updateByQueueChange();
    }
    QueueManager.setPlaylistName();
  }

  updateScroll() {
    this.scrollWrapper.scrollTop =
      this.scrollWrapper.scrollHeight -
      this.queue.previousElementSibling.offsetHeight -
      this.queue.scrollHeight;
  }

  processMusicToPlay(isExistingKept = false) {
    clearQueue = clearQueue.bind(this);
    let obj = this.tempObj,
      context = this.tempContext,
      isLibrary = context.startsWith("library"),
      isFiltered =
        window["library-container"].classList.contains("searching") ||
        window["library-container"].classList.contains("only-liked") ||
        window["library-container"].classList.contains("only-new");

    if (!obj && !context) return;

    this.tempObj = this.tempContext = undefined;

    if (isExistingKept) {
      if (isLibrary) {
        // 라이브러리 요소의 경우 그 음악만 나중에 재생.
        if (isFiltered) {
          let contextMusics = libraryManager.getFilteredContents();
          QueueManager.playNext(
            contextMusics,
            context,
            controller.isShuffled,
            obj.id
          );
        } else {
          QueueManager.playNext(obj, context);
          controller.nextButton.click();
        }
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
    } else {
      clearQueue();
      this._updateQueueState(true);
    }

    if (controller.currentInfo?.reference) {
      controller.currentInfo.reference.isPlaying = false;
    }
    document.querySelectorAll(".playing").forEach((item) => {
      item.classList.remove("playing");
    });
    document.querySelectorAll(".current").forEach((item) => {
      item.classList.remove("current");
    });

    if (isLibrary && !isFiltered) {
      let nextObj;

      if (!controller.isShuffled) {
        nextObj = libraryManager.getNextObj(obj.id); // 라이브러리 매니저가 정렬 조건에 따라 알아서 골라줌.
      } else {
        nextObj = this._chooseRandom();
      }

      let arr = nextObj ? [obj, nextObj] : [obj];
      this._applyToQueue(arr, context);
      this.queueRepo = null; // 라이브러리는 저장소를 따로 만들지 않음.
    } else {
      let currentId = obj.id;
      let contextMusics = isLibrary
        ? libraryManager.getFilteredContents()
        : playlistManager.getPlaylistContents(context);

      this._applyToQueue(contextMusics, context);
      let currentMusic = this.queue.querySelector(`[music-id="${currentId}"]`);
      if (controller.isShuffled) {
        this._shuffleQueue(true);
        this.queue.prepend(currentMusic);
      } else {
        Controller.updateMusicToPlay(currentMusic);
        return;
      }
    }

    Controller.playMusic();

    this.updateScroll();

    function clearQueue() {
      [].forEach.call(this.queue.children, (elem) => {
        this._mapManager(elem.musicObj, "delete");
      });

      this._clearQueue();
    }
  }

  clearRecord() {
    this.record.innerHTML = "";
    this.updateScroll();
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
      let elem = this._itembuilder(info, context);
      this.queueRepo.append(elem);
    }
  }

  _mapManager(obj, method = "set") {
    let key = obj?.id;
    if (!key) return undefined;
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
    elem.reordered = true;
    let origNextElem = elem.nextElementSibling;
    if (origNextElem == newNextElem) return;
    else {
      if (newNextElem) {
        newNextElem.before(elem);
      } else {
        newNextElem = this.queue.lastElementChild;
        newNextElem.after(elem);
      }

      if (!controller.isShuffled) {
        if (this.queueState) this._updateQueueState(false);
      }

      Controller.updateByQueueChange();
    }
  }

  _clearBeforeAfter() {
    while (QueueManager.currentMusic.nextElementSibling) {
      // 다음 음악 비우기
      let target = controller.currentMusic.nextElementSibling;
      this._mapManager(target.musicObj, "delete");
      target.remove();
    }

    while (QueueManager.currentMusic.previousElementSibling) {
      // 이전 음악 비우기
      let target = controller.currentMusic.previousElementSibling;
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
    let gotcha = false;
    let randObj;

    while (!gotcha) {
      let target = libraryManager.chooseRandObj();
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
        shuffleFragment.append(controller.currentMusic.nextElementSibling);
      }
    }

    let shuffleArr = Array.from(shuffleFragment.children);
    // 피셔-예이츠 알고리즘
    shuffleHelper(shuffleArr);

    shuffleArr.forEach((item) => {
      this.queue.append(item);
    });

    // documentFragment를 지우기.
    shuffleFragment = null;
  }

  _updateQueueState(bool) {
    this.queueState = bool;
    if (bool) {
      this.stateIndicator.classList.add("active");
    } else {
      this.stateIndicator.classList.remove("active");
      if (!this.queueRepo) {
        // 저장고가 비워져있을 경우 큐를 복사해서 새로 만들어줌.
        this.queueRepo = new DocumentFragment();

        [].forEach.call(this.queue.children, (item) => {
          let clone = item.cloneNode(true);
          clone.removeAttribute("style");
          clone.classList.remove("slip-reordering");
          this.queueRepo.append(clone);
        });
      }
    }
  }

  _itembuilder(obj, context) {
    if (!obj || obj.isHided == true) return;
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
