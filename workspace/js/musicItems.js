/*
 * 음악 아이템들의 객체 생성자

 * updateProp() : contstructor에서 초기화되지 않은 프로퍼티들이
 * 요소가 복제되는 과정에서 소실됐을 때 다시 붙여주는 메소드
 * 
 * bindHandler() : 위와 같은 맥락에서 핸들러를 다시 달아주는 메소드.
 */

class MusicItem extends HTMLDivElement {
  constructor() {
    super();
    this.context = "";
    this._builder = this._builder.bind(this);
    this._setInnerText = this._setInnerText.bind(this);
    this.toggleLikeState = this.toggleLikeState.bind(this);

    if (this.getAttribute("music-id")) this.updateProp();
  }

  setup(obj) {
    this.classList.add("music-item");
    this.setAttribute("music-id", obj.id);
    this.setAttribute("song-title", obj.title);
    this.setAttribute("song-artist", obj.artist);
    this.setAttribute("duration", obj.duration);
    this.setAttribute("is-liked", obj.isLiked);
    this.setAttribute("is-new", obj.isNew);
    this.referencedObj = obj;

    this._setInnerText(obj.title, obj.artist, obj.duration);
  }

  _setInnerText(title, artist, duration) {
    let songTitle = this.querySelector(".song-title");
    let songArtist = this.querySelector(".song-artist");
    let songDuration = this._timeFormatter(duration, "duration");

    songTitle.setAttribute("title", title);
    songTitle.innerHTML = title;
    songArtist.innerHTML = artist + " · " + songDuration;
  }

  toggleLikeState() {
    let id = this.getAttribute("music-id"),
      musics = document.querySelectorAll(`[music-id="${id}"]`),
      currentLike = this.referencedObj.isLiked,
      isPlaying = this.referencedObj.isPlaying;

    if (isPlaying) window["like-this-button"].click();
    else {
      musics.forEach((item) => {
        item.setAttribute("is-liked", !currentLike);
      });
      this.referencedObj.isLiked = !currentLike;
    }

    // 토스트 표시
    if (this.referencedObj.isLiked) {
      PopupManager.createToast("liked");
    } else {
      PopupManager.createToast("disliked");
    }
  }

  get musicObj() {
    // 사실 별로 쓸데없는 메소드이지만 고치는게 귀찮아서 놔뒀습니다.
    return this.referencedObj;
  }

  _builder(type) {
    //기본 구조 생성
    const frontIndicator = document.createElement("div");
    const songInfo = document.createElement("div");
    const buttonField = document.createElement("div");
    frontIndicator.classList.add("front-indicator");
    songInfo.classList.add("song-info");
    buttonField.classList.add("button-field");

    //곡 정보 영역 생성
    const songTitle = document.createElement("strong");
    const songArtist = document.createElement("span");
    songTitle.classList.add("song-title");
    songArtist.classList.add("song-artist");
    songInfo.append(songTitle, songArtist);

    //버튼 생성
    switch (type) {
      case "playable":
        const meatballs = document.createElement("button");
        const addButton = document.createElement("button");
        meatballs.classList.add("music-meatballs");
        addButton.classList.add("music-add");
        buttonField.append(meatballs, addButton);
        break;

      case "queue":
      case "edit":
        const dragButton = document.createElement("div");
        const deleteButton = document.createElement("button");
        dragButton.classList.add("music-drag");
        deleteButton.classList.add("music-delete");
        buttonField.append(dragButton, deleteButton);
        break;

      case "selectable":
        const selectButton = document.createElement("button");
        selectButton.classList.add("music-select");
        buttonField.append(selectButton);
        break;
    }

    this.append(frontIndicator, songInfo, buttonField);
  }

  _timeFormatter(time, type) {
    if (type == "duration") {
      let min = parseInt(time / 60);
      let sec = parseInt(time % 60);

      if (sec < 10) sec = "0" + sec;

      return min + ":" + sec;
    }
  }

  updateProp() {
    this.musicId = this.getAttribute("music-id");
    this.songTitle = this.getAttribute("music-id");
    this.songArtist = this.getAttribute("music-id");
    this.duration = this.getAttribute("music-id");
    this.isLiked = this.getAttribute("music-id");
    this.isNew = this.getAttribute("music-id");
    this.context = this.getAttribute("context");
    if (this.getAttribute("index")) this.index = this.getAttribute("index");
    this.referencedObj = DbManager.db[this.musicId]
      ? DbManager.db[this.musicId]
      : DbManager.db[this.musicId + "#"]
      ? DbManager.db[this.musicId + "#"]
      : DbManager.db[this.musicId.slice(-1)]
      ? DbManager.db[this.musicId.slice(-1)]
      : undefined;
  }

  bindHandler() {}
}

class PlayableItem extends MusicItem {
  constructor() {
    super();

    if (this.getAttribute("music-id")) {
      this.bindHandler();
    }
  }

  setup(obj) {
    this._builder("playable");
    super.setup(obj);
    if (obj.isPlaying) this.classList.add("playing");
    this.bindHandler();
  }

  onClick(e) {
    if (e.defaultPrevented) return;

    let target = e.target.closest(".music-item");

    if (target.classList.contains("active")) return;

    document.querySelectorAll(".music-item.active").forEach((item) => {
      item.classList.remove("active");
    });
    target.classList.add("active");
  }

  onDblclick(e) {
    if (e.defaultPrevented) return;

    QueueManager.playThis(this.referencedObj, this.context);
  }

  onContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    let elem = e.target.closest(".music-item");
    ContextmenuManager.addItemContextmenu(elem);
  }

  onClickAddToPlaylist(e) {
    e.preventDefault();
    let id = e.target.closest(".music-item").getAttribute("music-id");
    PlaylistManager.addToPlaylist(id);
  }

  bindHandler() {
    this.onclick = this.onClick;
    this.ondblclick = this.onDblclick.bind(this);

    const addButton = this.querySelector(".music-add");
    addButton.onclick = this.onClickAddToPlaylist.bind(this);

    const meatballs = this.querySelector(".music-meatballs");
    meatballs.onclick = this.onContextMenu.bind(this);
    this.oncontextmenu = this.onContextMenu.bind(this);
  }
}

class LibraryItem extends PlayableItem {
  constructor() {
    super();
    if (this.getAttribute("music-id")) {
      this.bindHandler();
    }
  }

  setup(obj) {
    super.setup(obj);
    this.classList.add("library");

    this.context = "library";
    this.setAttribute("context", this.context);

    this.bindHandler();
  }
}

class RecordItem extends PlayableItem {
  constructor() {
    super();
    if (this.getAttribute("music-id")) {
      this.bindHandler();
    }
  }

  setup(obj) {
    super.setup(obj);
    this.classList.add("record");

    this.context = "record";
    this.setAttribute("context", this.context);

    this.bindHandler();
  }

  onClick(e) {
    if (e.defaultPrevented) return;

    QueueManager.playRecord(this.musicObj);
  }

  bindHandler() {
    super.bindHandler();

    this.onclick = this.ondblclick = this.onClick.bind(this);
  }
}

class PlaylistItem extends PlayableItem {
  constructor() {
    super();

    this.context = "playlist:";

    if (this.getAttribute("music-id")) {
      this.bindHandler();
      this.context = this.getAttribute("context");
    }
  }

  setup(obj, context, index = "") {
    super.setup(obj);

    this.context += context;
    this.index = index;
    this.querySelector(".front-indicator").innerHTML = index;
    this.setAttribute("context", this.context);
    this.classList.add("playlist");

    this.bindHandler();
  }

  updateIndex(index) {
    if (this.index == index) return;
    this.index = index;
    this.querySelector(".front-indicator").innerHTML = index;
  }
}

class QueueItem extends MusicItem {
  constructor() {
    super();

    if (this.getAttribute("music-id")) {
      this.bindHandler();
    }
  }

  setup(obj, context, index = null) {
    this._builder("queue");

    super.setup(obj);

    this.context = context;
    this.classList.add("queue");
    if (!index) {
      this.index = hash(Math.floor(Math.random() * Date.now()));
    } else {
      this.index = index;
    }
    this.setAttribute("context", this.context);
    this.setAttribute("index", this.index);

    this.bindHandler();
  }

  onClick(e) {
    if (e.defaultPrevented) return;
    if (this.reordered) {
      this.reordered = false;
      return;
    }

    QueueManager.playQueue(this);
  }

  _deleteMusic(e) {
    e.preventDefault();
    QueueManager.deleteQueueItem(this);
  }

  onContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    let elem = e.target.closest(".music-item");
    ContextmenuManager.addItemContextmenu(elem);
  }

  bindHandler() {
    super.bindHandler();

    this.onclick = this.onClick.bind(this);
    this.oncontextmenu = this.onContextMenu;

    let deleteButton = this.querySelector(".music-delete");
    deleteButton.onclick = this._deleteMusic.bind(this);
    let dragButton = this.querySelector(".music-drag");
    dragButton.onclick = (e) => e.preventDefault();
  }
}

class EditingItem extends MusicItem {
  constructor() {
    super();

    if (this.getAttribute("music-id")) {
      this.bindHandler();
    }
  }

  setup(obj) {
    this._builder("edit");
    super.setup(obj);
    this.classList.add("editing");

    this.bindHandler();
  }

  _deleteMusic(e) {
    e.preventDefault();

    playlistManager?.editManager.deleteSong(this);
  }

  bindHandler() {
    super.bindHandler();

    let deleteButton = this.querySelector(".music-delete");
    deleteButton.onclick = this._deleteMusic.bind(this);
    let dragButton = this.querySelector(".music-drag");
    dragButton.onclick = (e) => e.preventDefault();
    this.oncontextmenu = (e) => e.preventDefault();
  }
}

class SelectableItem extends MusicItem {
  constructor() {
    super();

    if (this.getAttribute("music-id")) {
      this.bindHandler();
    }
  }

  setup(obj) {
    this._builder("selectable");
    super.setup(obj);
    this.classList.add("selectable");

    this.bindHandler();
  }

  _onclick() {
    let id = this.getAttribute("music-id");
    playlistManager?.selectableManager.toggleSelectedState(id);
  }

  bindHandler() {
    super.bindHandler();
    this.onclick = this._onclick.bind(this);
    this.oncontextmenu = (e) => e.preventDefault();
  }
}

customElements.define("library-item", LibraryItem, { extends: "div" });
customElements.define("playlist-item", PlaylistItem, { extends: "div" });
customElements.define("queue-item", QueueItem, { extends: "div" });
customElements.define("record-item", RecordItem, { extends: "div" });
customElements.define("editing-item", EditingItem, { extends: "div" });
customElements.define("selectable-item", SelectableItem, { extends: "div" });
