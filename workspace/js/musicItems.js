class MusicItem extends HTMLDivElement {
  constructor() {
    super();
    this.context = "";
    this._builder = this._builder.bind(this);
    this._setInnerText = this._setInnerText.bind(this);
    this._updateLikeStatus = this._updateLikeStatus.bind(this);
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
      if (item.getAttribute("music-id") == currentLike) return;
      item.setAttribute("music-id", currentLike);
    });
  }

  static get musicObj() {
    return this.referencedObj;
  }

  _builder(type) {
    //기본 구조 생성
    const frontIndicator = document.createElement("div");
    const songInfo = document.createElement("div");
    const buttonField = document.createElement("div");
    frontIndicator.classList.add("front-indicator");
    frontIndicator.setAttribute("data-index", "");
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
      let sec = time % 60;

      if (min < 10) min = "0" + min;
      if (sec < 10) sec = "0" + sec;

      return min + ":" + sec;
    }
  }
}

class PlayableItem extends MusicItem {
  constructor() {
    super();

    this._builder("playable");
    const addButton = this.querySelector(".music-add");

    addButton.onclick = this._addToPlaylistForButton.bind(this);
    this.onclick = this.__clickToPlay.bind(this);
  }

  setup(obj) {
    super.setup(obj);
    if (obj.isPlaying) this.classList.add("playing");
  }

  __clickToPlay(e) {
    if (e.defaultPrevented) return;
    let [obj, context] = [this.referencedObj, this.context];

    queueManager.playThis(obj, context);
  }

  _addToPlaylistForButton(e) {
    e.preventDefault();

    // playlistManager.addToPlaylist([this.referencedObj]); // 플레이리스트 매니저의 플레이리스트 추가 함수
  }
}

class LibraryItem extends PlayableItem {
  constructor() {
    super();
    this._recordPlay = this._recordPlay.bind(this);
  }

  setup(obj, isRecord = false) {
    super.setup(obj);
    this.classList.add("library");

    if (!isRecord) {
      this.context = "Library";
    } else {
      this.context = "Record";
      this.onclick = this._recordPlay;
    }

    const meatballs = this.querySelector(".music-meatballs");
    let contextMenu = this._openContextMenu.bind(this);
    meatballs.onclick = contextMenu;
    this.oncontextmenu = contextMenu;
  }

  _recordPlay(e) {
    if (e.defaultPrevented) return;
    let [obj, context] = [this.referencedObj, this.context];

    queueManager.addToRightNext(obj, context);
  }

  _openContextMenu(e) {
    e.preventDefault();

    /* let contextMenu = document.createElement("library-context");
    contextMenu.setup(this);
    this.append(contextMenu); */ // 컨텍스트 메뉴 만들어 추가.
  }
}

class PlaylistItem extends PlayableItem {
  constructor() {
    super();

    this.context = "Playlist:";
  }

  setup(obj, context, index = "") {
    super.setup(obj);

    this.context += context;
    this.index = index;
    this.querySelector(".front-indicator").innerHTML = index;
    this.classList.add("playlist");

    let meatballs = this.querySelector(".music-meatballs");
    let contextMenu = this._openContextMenu.bind(this);
    meatballs.onclick = contextMenu;
    this.oncontextmenu = contextMenu;
  }

  updateIndex(index) {
    if (this.index == index) return;
    this.index = index;
    this.querySelector(".front-indicator").innerHTML = index;
  }

  _openContextMenu(e) {
    e.preventDefault();

    /* let contextMenu = document.createElement("playlist-context");
    contextMenu.setup(this);
    this.append(contextMenu); */ // 컨텍스트 메뉴 생성
  }
}

class QueueItem extends MusicItem {
  constructor() {
    super();

    this._builder("queue");
    let deleteButton = this.querySelector(".music-delete");

    deleteButton.onclick = this._deleteMusic.bind(this);
    this.onclick = this._clickToPlay.bind(this);
    this.oncontextmenu = this._openContextMenu.bind(this);
  }

  setup(obj, context, index = 0) {
    super.setup(obj);

    if (obj.isPlaying) this.classList.add("playing");
    this.context = context;
    this.classList.add("queue");
    this.index = index;
  }

  _clickToPlay(e) {
    if (e.defaultPrevented) return;

    // queueManager.playQueue(this.referencedObj, this.context); // 큐매니저에서 재생을 맡김.
  }

  _deleteMusic(e) {
    e.preventDefault();

    this.remove();
  }

  _openContextMenu(e) {
    e.preventDefault();

    /* let contextMenu = document.createElement("queue-context");
    contextMenu.setup(this);
    this.append(contextMenu); */
  }
}

class EditingItem extends MusicItem {
  constructor() {
    super();

    this._builder("edit");
    let deleteButton = this.querySelector(".music-delete");

    deleteButton.onclick = this._deleteMusic.bind(this);
  }

  setup(obj) {
    super.setup(obj);
    this.classList.add("editing");
  }

  _deleteMusic(e) {
    e.preventDefault();

    this.remove();
  }
}

class SelectableItem extends MusicItem {
  constructor() {
    super();
    this._builder("selectable");
    this.isSelected = false;
    this.onclick = this._toggleSelectedStatus.bind(this);
  }

  setup(obj) {
    super.setup(obj);
    this.classList.add("selectable");
  }

  _toggleSelectedStatus(e) {
    this.isSelected = !this.isSelected;
    this.classList.toggle("selected");
    // this.index = selectableManager.addOrClear(this.referencedObj, this.index) => 인덱스가 undefined이면 스택에 추가, 새로운 인덱스를 반환, 인덱스가 있으면 해당 인덱스의 아이템 삭제 후 undefined 반환.
  }
}

customElements.define("library-item", LibraryItem, { extends: "div" });
customElements.define("playlist-item", PlaylistItem, { extends: "div" });
customElements.define("queue-item", QueueItem, { extends: "div" });
customElements.define("editing-item", EditingItem, { extends: "div" });
customElements.define("selectable-item", SelectableItem, { extends: "div" });
