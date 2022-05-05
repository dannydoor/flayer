class MusicObject extends HTMLLIElement{
  constructor() {
    super()
    this.context = '';
  }
  
  setup(obj) {
    this.setAttribute('music-id', obj.id);
    this.setAttribute('title', obj.title);
    this.setAttribute('artist', obj.artist);
    this.setAttribute('duration', obj.duration);
    this.setAttribute('is-liked', obj.isLiked);
    this.setAttribute('is-new', obj.isNew);
    this.referencedObj = obj;
    
    this.setInnerText(obj.title, obj.artist, obj.duration);
  }
  
  setInnerText(title, artist, duration) {
    const shadow = this.shadowRoot;
    let songTitle = shadow.querySelector('.song-title');
    let songArtist = shadow.querySelector('.song-artist');
    let songduration = timeFormatter(duration, 'duration');
    
    songTitle.innerHTML = title;
    songTitle.setAttribute('data-tooltip', title);
    songArtist.innerHTML = artist + ' · ' + duration;
    songArtist.setAttribute('data-tooltip', artist);
  }
  
  updateLikeStatus() {
    let id = this.getAttribute('music-id');
    let musics = document.querySelectorAll(`[music-id=${id}]`);
    let currentLike = this.getAttribute('is-liked');
    
    musics.forEach(item => {
      if (item.getAttribute('music-id') == currentLike) return;
      item.setAttribute('music-id', currentLike);
    })
  }
  
  static get musicObject() {
    return this.referencedObj;
  }
}

class PlayableObject extends MusicObject {
  constructor() {
    super();
    
    shadowMaker(this, 'playable');
    const addButton = this.shadowRoot.querySelector('.music-add');
    
    addButton.onclick = this.addToPlaylistForButton.bind(this);
    this.onclick = this.clickToPlay.bind(this);
  }
  
  setup(obj) {
    this.prototype.setup(obj);
    if (obj.isPlaying) this.classList.add('playing');
  }
  
  clickToPlay(e) {
    if (e.defaultPrevented) return;
    
    this.sendToPlay(this.referencedObj, this.context);
  }
  
  addToPlaylistForButton(e) {
    e.preventDefault();
    
    playlistManager.addToPlaylist([this.referencedObj]); //플레이리스트 매니저의 플레이리스트 추가 함수
  }
  
  sendToPlay(music, context) {
    //재생 대기열에 정보를 보내는 메소드.
  }
}

class LibraryObject extends PlayableObject {
  constructor() {
    super()
    
    const meatballs = this.shadowRoot.querySelector('.music-meatballs');
    meatballs.onclick = this.openContextMenu.bind(this);
    
    this.context = 'Library';
    this.oncontextmenu = this.openContextMenu.bind(this);
  }
  
  setup(obj) {
    this.prototype.setup(obj);
  }
  
  openContextMenu(e) {
    e.preventDefault();
    
    let contextMenu = document.createElement('library-context');
    contextMenu.setup(this);
    this.append(contextMenu);
  }
}

class PlaylistObject extends PlayableObject {
  constructor() {
    super()
    
    shadowMaker(this, 'playlist');
    let meatballs = this.shadowRoot.querySelector('.music-meatballs');
    
    meatballs.onclick = this.openContextMenu.bind(this);
    this.context = 'Playlist';
    this.oncontextmenu = this.openContextMenu.bind(this);
  }
  
  setup(obj, context, index='') {
    this.prototype.setup(obj);
    this.context += context;
    this.shadowRoot.querySelector('.frontIndicator').dataset.index = index;
  }
  
  openContextMenu(e) {
    e.preventDefault();
    
    let contextMenu = document.createElement('playlist-context');
    contextMenu.setup(this);
    this.append(contextMenu);
  }
}

class QueueObject extends MusicObject {
  constructor() {
    super()
    
    shadowMaker(this, 'queue');
    let deleteButton = this.shadowRoot.querySelector('.music-delete');
    
    deleteButton.onclick = this.deleteMusic.bind(this);
    this.onclick = this.clickToPlay.bind(this);
    this.oncontextmenu = this.openContextMenu.bind(this);
  }
  
  setup(obj, context) {
    this.prototype.setup(obj);
    
    if (obj.isPlaying) this.classList.add('playing');
    this.context = context;
  }
  
  clickToPlay(e) {
    if (e.defaultPrevented) return;
    
    queueManager.playQueue(this.referencedObj, this.context); //큐매니저에서 재생을 맡김.
  }
  
  deleteMusic(e) {
    e.preventDefault();
    
    this.remove();
  }
  
  openContextMenu(e) {
    e.preventDefault();
    
    let contextMenu = document.createElement('queue-context');
    contextMenu.setup(this);
    this.append(contextMenu);
  }
}

class EditingObject extends MusicObject {
  constructor() {
    super()
    
    shadowMaker(this, 'edit');
    let deleteButton = this.shadowRoot.querySelector('.music-delete');
    
    deleteButton.onclick = this.deleteMusic.bind(this);
  }
  
  setup(obj) {
    this.prototype.setup(obj);
  }
}

class SelectableObject extends MusicObject {
  constructor() {
    super()
    shadowMaker(this, 'selectable');
    this.isSelected = false;
    this.onclick = this.toggleSelectedStatus.bind(this);
  }
  
  toggleSelectedStatus(e) {
    this.isSelected = !this.isSelected;
    this.classList.toggle('selected');
  }
}

customElements.define('library-object', LibraryObject, {extends: 'li'});
customElements.define('playlist-object', PlaylistObject, {extends: 'li'});
customElements.define('queue-object', QueueObject, {extends: 'li'});
customElements.define('editing-object', EditingObject, {extends: 'li'});
customElements.define('selectable-object', SelectableObject, {extends: 'li'});

function timeFormatter(time, type) {
  if (type == 'duration') {
    let min = time/60;
    let sec = time%60;
    
    if (min < 10) min = '0' + min;
    
    return min + ':' + sec;
  }
}

function shadowMaker(elem, type) {
  let shadow;
  
  if (!elem.shadowRoot) {
    shadow = elem.attatchShadow({mode: 'open'});
  } else {
    shadow = elem.shadowRoot;
  }
  
  //기본 구조 생성
  const frontIndicator = document.createElement('div');
  const songInfo = document.createElement('div');
  const buttonField = document.createElement('div');
  const styleObj = shadowStyle.content.cloneNode(true);
  frontIndicator.classList.add('front-indicator');
  frontIndicator.setAttribute('data-index', '');
  songInfo.classList.add('song-info');
  buttonField.classList.add('button-field');
  
  //곡 정보 영역 생성
  const songTitle = document.createElement('strong');
  const songArtist = document.createElement('span');
  songTitle.classList.add('song-title');
  songArtist.classList.add('song-artist');
  songInfo.append(songTitle, songArtist);
  
  //버튼 생성
  switch(type) {
    case 'playable' :
      const meatballs = document.createElement('button');
      const addButton = document.createElement('button');
      meatballs.classList.add('music-meatballs');
      addButton.classList.add('music-add');
      buttonField.append(meatballs, addButton);
      break;

    case 'queue' :
    case 'edit' : 
      const dragButton = document.createElement('div');
      const deleteButton = document.createElement('button');
      dragButton.classList.add('music-drag');
      deleteButton.classList.add('music-delete');
      buttonField.append(dragButton, deleteButton);
      break;
      
    case 'selectable' : 
      const selectButton = document.createElement('button');
      selectButton.classList.add('music-select');
      buttonField.append(selectButton);
      break;
  };
  
  shadow.append(frontIndicator, songInfo, buttonField, styleObj);
  
  return;
}