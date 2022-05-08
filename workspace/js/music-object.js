class MusicItem extends HTMLDivElement{
  constructor() {
    super()
    this.context = '';
  }
  
  setup(obj) {
    this.setAttribute('music-id', obj.id);
    this.setAttribute('song-title', obj.title);
    this.setAttribute('song-artist', obj.artist);
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
    let songDuration = timeFormatter(duration, 'duration');
    
    songTitle.setAttribute('title', title);
    songTitle.innerHTML = title;
    songArtist.innerHTML = artist + ' · ' + songDuration;
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
  
  static get musicItem() {
    return this.referencedObj;
  }
}

class PlayableItem extends MusicItem {
  constructor() {
    super();
    
    shadowMaker.call(this, 'playable');
    const addButton = this.shadowRoot.querySelector('.music-add');
    
    addButton.onclick = this.addToPlaylistForButton.bind(this);
    this.onclick = this.clickToPlay.bind(this);
  }
  
  setup(obj) {
    super.setup(obj);
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
    console.log('sended');
  }
}

class LibraryItem extends PlayableItem {
  constructor() {
    super()
    
    const meatballs = this.shadowRoot.querySelector('.music-meatballs');
    meatballs.onclick = this.openContextMenu.bind(this);
    
    this.context = 'Library';
    this.oncontextmenu = this.openContextMenu.bind(this);
  }
  
  setup(obj) {
    super.setup(obj);
    this.classList.add('library')
  }
  
  openContextMenu(e) {
    e.preventDefault();
    
    let contextMenu = document.createElement('library-context');
    contextMenu.setup(this);
    this.append(contextMenu);
  }
}

class PlaylistItem extends PlayableItem {
  constructor() {
    super()
    
    let meatballs = this.shadowRoot.querySelector('.music-meatballs');
    
    meatballs.onclick = this.openContextMenu.bind(this);
    this.context = 'Playlist:';
    this.oncontextmenu = this.openContextMenu.bind(this);
  }
  
  setup(obj, context, index='') {
    super.setup(obj);
    this.context += context;
    this.index = index;
    this.shadowRoot.querySelector('.front-indicator').innerHTML = index;
    this.classList.add('playlist')
  }
  
  updateIndex(index) {
    if (this.index == index) return;
    this.index = index;
    this.shadowRoot.querySelector('.front-indicator').innerHTML = index;
  }
  
  openContextMenu(e) {
    e.preventDefault();
    
    let contextMenu = document.createElement('playlist-context');
    contextMenu.setup(this);
    this.append(contextMenu);
  }
}

class QueueItem extends MusicItem {
  constructor() {
    super()
    
    shadowMaker.call(this, 'queue');
    let deleteButton = this.shadowRoot.querySelector('.music-delete');
    
    deleteButton.onclick = this.deleteMusic.bind(this);
    this.onclick = this.clickToPlay.bind(this);
    this.oncontextmenu = this.openContextMenu.bind(this);
  }
  
  setup(obj, context) {
    super.setup(obj);
    
    if (obj.isPlaying) this.classList.add('playing');
    this.context = context;
    this.classList.add('queue')
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

class EditingItem extends MusicItem {
  constructor() {
    super()
    
    shadowMaker.call(this, 'edit');
    let deleteButton = this.shadowRoot.querySelector('.music-delete');
    
    deleteButton.onclick = this.deleteMusic.bind(this);
  }
  
  deleteMusic(e) {
    e.preventDefault();
    
    this.remove();
  }
  
  setup(obj) {
    super.setup(obj);
    this.classList.add('editing')
  }
}

class SelectableItem extends MusicItem {
  constructor() {
    super()
    shadowMaker.call(this, 'selectable');
    this.isSelected = false;
    this.onclick = this.toggleSelectedStatus.bind(this);
  }
  
  setup(obj) {
    super.setup(obj);
    this.classList.add('selectable')
  }
  
  toggleSelectedStatus(e) {
    this.isSelected = !this.isSelected;
    this.classList.toggle('selected');
    // this.index = selectableManager.addOrClear(this.referencedObj, this.index) => 인덱스가 undefined이면 스택에 추가, 새로운 인덱스를 반환, 인덱스가 있으면 해당 인덱스의 아이템 삭제 후 undefined 반환.
  }
}

customElements.define('library-item', LibraryItem, {extends: 'div'});
customElements.define('playlist-item', PlaylistItem, {extends: 'div'});
customElements.define('queue-item', QueueItem, {extends: 'div'});
customElements.define('editing-item', EditingItem, {extends: 'div'});
customElements.define('selectable-item', SelectableItem, {extends: 'div'});

function timeFormatter(time, type) {
  if (type == 'duration') {
    let min = parseInt(time/60);
    let sec = time%60;
    
    if (min < 10) min = '0' + min;
    if (sec < 10) sec = '0' + sec;
    
    return min + ':' + sec;
  }
}

function shadowMaker(type) {
  let shadow;
  
  if (!this.shadowRoot) {
    shadow = this.attachShadow({mode: 'open'});
  } else {
    shadow = this.shadowRoot;
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