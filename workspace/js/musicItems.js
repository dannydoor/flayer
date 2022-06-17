class MusicItem extends HTMLDivElement {
  constructor() {
    super();
    this.context = "";
    this._builder = this._builder.bind(this);
    this._setInnerText = this._setInnerText.bind(this);
    this._updateLikeStatus = this._updateLikeStatus.bind(this);

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

  _updateLikeStatus() {
    let id = this.getAttribute("music-id");
    let musics = document.querySelectorAll(`[music-id=${id}]`);
    let currentLike = this.getAttribute("is-liked");

    musics.forEach((item) => {
      if (item.getAttribute("is-liked") == currentLike) return;
      item.setAttribute("is-liked", currentLike);
    });
  }

  get musicObj() {
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
    this.referencedObj = objTable[this.musicId];
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

  _addToPlaylistForButton(e) {
    e.preventDefault();

    // playlistManager.addToPlaylist([this.referencedObj]); // 플레이리스트 매니저의 플레이리스트 추가 함수
  }

  bindHandler() {
    this.onclick = this.onClick;
    this.ondblclick = this.onDblclick.bind(this);

    const addButton = this.querySelector(".music-add");
    addButton.onclick = this._addToPlaylistForButton.bind(this);
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

  onContextMenu(e) {
    e.preventDefault();

    QueueManager.playNext(this.referencedObj, this.context);
    /* let contextMenu = document.createElement("library-context");
    contextMenu.setup(this);
    this.append(contextMenu); */ // 컨텍스트 메뉴 만들어 추가.
  }

  bindHandler() {
    super.bindHandler();

    const meatballs = this.querySelector(".music-meatballs");
    meatballs.onclick = this.onContextMenu.bind(this);
    this.oncontextmenu = this.onContextMenu.bind(this);
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

  onContextMenu(e) {
    e.preventDefault();
    // 컨텍스트 메뉴
  }

  bindHandler() {
    super.bindHandler();

    this.onclick = this.onClick.bind(this);

    const meatballs = this.querySelector(".music-meatballs");
    meatballs.onclick = this.onContextMenu.bind(this);
    this.oncontextmenu = this.onContextMenu.bind(this);
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

  onContextMenu(e) {
    e.preventDefault();
    /* let contextMenu = document.createElement("playlist-context");
    contextMenu.setup(this);
    this.append(contextMenu); */ // 컨텍스트 메뉴 생성
  }

  bindHandler() {
    super.bindHandler();

    let meatballs = this.querySelector(".music-meatballs");
    meatballs.onclick = this.onContextMenu.bind(this);
    this.oncontextmenu = this.onContextMenu.bind(this);
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
      this.index = hash(Math.floor(Math.random() * Date.now()) + obj.id);
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

    QueueManager.playNext(this.musicObj, this.getAttribute("context"));
    /* let contextMenu = document.createElement("queue-context");
    contextMenu.setup(this);
    this.append(contextMenu); */
  }

  bindHandler() {
    super.bindHandler();

    this.onclick = this.onClick.bind(this);
    this.oncontextmenu = this.onContextMenu.bind(this);

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

    this.remove();
  }

  bindHandler() {
    super.bindHandler();

    let deleteButton = this.querySelector(".music-delete");
    deleteButton.onclick = this._deleteMusic.bind(this);
    let dragButton = this.querySelector(".music-drag");
    dragButton.onclick = (e) => e.preventDefault();
  }
}

class SelectableItem extends MusicItem {
  constructor() {
    super();
  }

  setup(obj) {
    this._builder("selectable");
    this.isSelected = false;
    super.setup(obj);
    this.classList.add("selectable");

    this.bindHandler();
  }

  _toggleSelectedStatus(e) {
    this.isSelected = !this.isSelected;
    this.classList.toggle("selected");
    // this.index = selectableManager.addOrClear(this.referencedObj, this.index) => 인덱스가 undefined이면 스택에 추가, 새로운 인덱스를 반환, 인덱스가 있으면 해당 인덱스의 아이템 삭제 후 undefined 반환.
  }

  bindHandler() {
    super.bindHandler();
    this.onclick = this._toggleSelectedStatus.bind(this);
  }
}

customElements.define("library-item", LibraryItem, { extends: "div" });
customElements.define("playlist-item", PlaylistItem, { extends: "div" });
customElements.define("queue-item", QueueItem, { extends: "div" });
customElements.define("record-item", RecordItem, { extends: "div" });
customElements.define("editing-item", EditingItem, { extends: "div" });
customElements.define("selectable-item", SelectableItem, { extends: "div" });
