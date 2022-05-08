class Controller {
  constructor(initObj = null, initContext = null, initShuffle = false, initRepeat = false) {
    this.isShuffled = initShuffle;
    this.isRepeat = initRepeat;
    this.timestamp = null;
    this._updatePlayBar = this._updatePlayBar.bind(this);
    this._updateMuteState = this._updateMuteState.bind(this);
    this._updateControlBar = this._updateControlBar.bind(this);
    this._updateVolumeBar = this._updateVolumeBar.bind(this);
    this._updateProperties = this._updateProperties.bind(this);
    this._onPlayHandler = this._onPlayHandler.bind(this);
    this._onPauseHandler = this._onPauseHandler.bind(this);
    this._onBufferHandler = this._onBufferHandler.bind(this);
    this._onTimeHandler = this._onTimeHandler.bind(this);
    this._playBarHandler = this._playBarHandler.bind(this);
    this._playBarChangeHandler = this._playBarChangeHandler.bind(this);
    this._muteButtonHandler = this._muteButtonHandler.bind(this);
    this._setupOptions = {
      'autostart': true,
      'width': '100%',
      'mute': false,
      'controls': false,
    }

    this.setupPlayer(initObj, initContext);

    this.playButton = window['play-or-pause'];
    this.prevButton = window['prev-button'];
    this.nextButton = window['next-button'];
    this.repeatButton = window['repeat-button'];
    this.shuffleButton = window['shuffle-button'];
    this.playBar = window['play-bar'];
    this.volumeBar = window['volume-bar'];
    this.currentTime = window['current-time'];
    this.remainingTime = window['remaining-time'];
    this.muteButton = window['mute-button'];
    this.songTitleSection = window['curr-song-title'];
    this.songArtistSection = window['curr-song-artist'];
    this.openPlaylistButton = window['open-curr-playlist'];
    this.likeButton = window['like-this-button'];
    this.meatballsButton = window['meatball-button'];
  }

  _updateControlBar() {
    let isLiked = this.isLiked ? 'liked' : '';
    let isContextValid = this.context.startsWith('playlist:') ? true : false;
    let playlistID;
    let playlistName = null;
    if (isContextValid) playlistID = this.context.slice(9);

    this.playBar.setAttribute('step', parseInt(this.duration));
    this.playBar.setAttribute('value', 0);
    [this.currentTime.innerHTML, this.remainingTime.innerHTML] = this._timeFormatter(0, this.duration);
    this.volumeBar.setAttribute('value', jwplayer().getVolume());

    this.songTitleSection.innerHTML = this.title;
    this.songArtistSection.innerHTML = this.artist
    
    this.likeButton.className = isLiked;

    if (!isContextValid) {
      this.toggleDisabledStatus('playlist', true);
      playlistName = playlistManager.getPlaylistByID(playlistID); // 플레이리스트 이름 접근
      this.openPlaylistButton.setAttribute('data-tooltip', '재생 중인 플레이리스트: ' + playlistName);
    }
  }

  _updatePlayBar() {
    let currentTime = jwplayer().getPosition() - this.startTime;
    if (this.playBar.getAttribute('value') == currentTime) return;
    this.playBar.setAttribute('value', currentTime);
    [this.currentTime.innerHTML, this.remainingTime.innerHTML] = this._timeFormatter(currentTime, this.duration);
  }

  _updateVolumeBar() {
    let currentVolume = jwplayer().getVolume();
    if (this.volumeBar.getAttribute('value') == currentVolume) return;
    this.volumeBar.setAttribute('value', currentVolume);
  }

  _updateMuteState() {
    let currentMuteState = jwplayer().getMute();
    let userMuteState = this.volumeBar.getAttribute('mute')

    if (userMuteState == currentMuteState) return;
    else {
      this.volumeBar.setAttribute('mute', currentMuteState);
      if (currentMuteState) {
        this.volumeBar.removeEventListener('input', this._volumeBarHandler);
        this.volumeBar.addEventListener('input', this._volumeBarHandlerMuted);
      } else {
        this.volumeBar.removeEventListener('input', this._volumeBarHandlerMuted);
        this.volumeBar.addEventListener('input', this._volumeBarHandler);
      }
    }
  }

  _updatePlayerHandler() {
    let onTimeHandler = this._onTimeHandler;
    jwplayer().on('time', onTimeHandler);
  }

  _updateProperties(obj, context) {
    this.musicID = obj.id;
    this.title = obj.title;
    this.artist = obj.artist;
    this.context = context;
    this.URL = "https://media.dema.mil.kr/mediavod/_definst_/smil:dematv/" + obj.src + '/playlist.m3u8';
    // this.URL = 'http://media.dema.mnd.mil:1935/vod/_definst_/mp4:DIMOS/' + obj.src + '/playlist.m3u8'; 인트라넷 버전
    this.startTime = obj.startTime;
    this.endTime = obj.endTime;
    this.duration = obj.duration;
    this.isLiked = obj.isLiked;
    this.referencedObj = obj;
  }

  setupPlayer(obj, context) {
    if (obj) {
      // 마지막 세션 세팅
      this._updateProperties(obj, context);
      this._setupOptions.file = this.URL;
      jwplayer('video').setup.call(this, this._setupOptions);
      jwplayer().once.call(this, 'beforePlay', () => {
        jwplayer().seek(this.startTime);
        this._updateControlBar();
      });
      this.setPlayerHandlers();
      this._updatePlayerHandler();
    } else {
      // 초기화
      this._setupOptions.file = "https://media.dema.mil.kr/mediavod/_definst_/smil:dematv/202205/9617396921029532/9617396921029532.smil/playlist.m3u8";
      jwplayer('video').setup.call(this, this._setupOptions);
      jwplayer().once('ready', () => jwplayer().stop());
      // 컨트롤바 비활성화
      this.toggleDisabledStatus('control', true);
      this.toggleDisabledStatus('bars', true);
      this.toggleDisabledStatus('info', true);
      // 창 정보 비우기
      this.playBar.setAttribute('step', 1);
      this.playBar.setAttribute('value', 0);
      this.currentTime.innerHTML = '00:00';
      this.remainingTime.innerHTML = '- 00:00';
      this.songTitleSection.innerHTML = '';
      this.songArtistSection.innerHTML = '';
      // 핸들러 달기
      this.setPlayerHandlers();
    }
    this.volumeBar.setAttribute('mute', false);
    this.volumeBar.addEventListener('input', this._volumeBarHandler);
  }

  loadMusic(obj) {
    jwplayer().off('time');
    this._updateProperties(obj);

    let file = {'file': this.URL};

    jwplayer().once.call(this, 'beforePlay', () => jwplayer().seek(this.startTime));
    jwplayer().load(file);

    this._updatePlayerHandler();
    this._updateControlBar();
  }

  setPlayerHandlers() {
    let onSeekHandler = this._updatePlayBar;
    let onPlayHandler = this._onPlayHandler;
    let onPauseHandler = this._onPauseHandler;
    let onBufferHandler = this._onBufferHandler;
    let onVolumeHandler = this._updateVolumeBar;
    let onMuteHandler = this._updateMuteState;

    jwplayer().on('seek', onSeekHandler);
    jwplayer().on('play', onPlayHandler);
    jwplayer().on('pause', onPauseHandler);
    jwplayer().on('buffer', onBufferHandler);
    jwplayer().on('volume', onVolumeHandler);
    jwplayer().on('mute', onMuteHandler);
    jwplayer().on('complete', () => window['next-button'].click());
  }

  _toggleControlStatus() {
    let isPlaying = jwplayer('video').getState();
    let currState = (this.playButton.className == 'play') ? 'paused' : (this.playButton.className == 'pause') ? 'playing' : 'undefined';
    
    if (isPlaying == 'buffering') {
      this.toggleDisabledStatus('control', true);
      return;
    } else if (isPlaying == 'playing' && currState != isPlaying) {
      this.playButton.className = 'pause';
    } else if (isPlaying == 'paused' && currState != isPlaying) {
      this.playButton.className = 'play';
    }

    this.toggleDisabledStatus('control', false);
  }

  toggleDisabledStatus(node, bool) {
    switch(node) {
      case 'control' : {
        this.playButton.disabled = bool;
        this.nextButton.disabled = bool;
        this.prevButton.disabled = bool;
        break;
      }
      case 'bars' : {
        this.playBar.disabled = bool;
        this.volumeBar.disabled = bool;
        this.muteButton.disabled = bool;
        break;
      }
      case 'playlist' : {
        this.openPlaylistButton.disabled = bool;
        break;
      }
      case 'info' : {
        this.openPlaylistButton.disabled = bool;
        this.likeButton.disabled = bool;
        this.meatballsButton.disabled = bool;
        break;
      }
    }
    return;
  }

  _onPlayHandler(e) {
    let oldstate = e.oldstate;
    if (oldstate === 'buffering') {
      this._toggleControlStatus();
    }
  }

  _onPauseHandler(e) {
    let oldstate = e.oldstate;
    if (oldstate === 'buffering') {
      this._toggleControlStatus();
    }
  }

  _onTimeHandler(e) {
    let startTime = this.startTime;
    let endTime = this.endTime;
    let currentTime = e.position;

    if (currentTime < startTime) {
      jwplayer().seek(startTime);
    } else if (currentTime >= endTime) {
      window['next-button'].click();
    }
  }

  _onBufferHandler(e) {
    let oldstate = e.oldstate;
    if (oldstate === 'playing') {
      this._toggleControlStatus();
    }
  }

  _muteButtonHandler() {
    let currentMuteState = this.volumeBar.getAttribute('mute');
    currentMuteState = !currentMuteState;
    
    if (currentMuteState) {
      this.volumeBar.removeEventListener('input', this._volumeBarHandler);
      this.volumeBar.addEventListener('input', this._volumeBarHandlerMuted);
    } else {
      this.volumeBar.removeEventListener('input', this._volumeBarHandlerMuted);
      this.volumeBar.addEventListener('input', this._volumeBarHandler);
    }
  }

  _volumeBarHandler(e) {
    let value = e.target.value;
    e.target.style.background = 'linear-gradient(to right, var(--color-primary, #595ae2) 0%, var(--color-primary, #595ae2) ' + value +'%, var(--color-base-3, #d9d9d9) ' + value + '%, var(--color-base-3, #d9d9d9) 100%)'
  }
  
  _volumeBarHandlerMuted(e) {
    let value = e.target.value;
    e.target.style.background = 'linear-gradient(to right, var(--color-ceil-2, #A9A9A9) 0%, var(--color-ceil-2, #A9A9A9) ' + value +'%, var(--color-base-3, #d9d9d9) ' + value + '%, var(--color-base-3, #d9d9d9) 100%)'
  }

  _volumeBarChangeHandler (e) {
    let volume = e.target.value;
    jwplayer().setVolume(volume);
  }

  _playBarHandler(e) {
    let value = e.target.value;
    value = (value / this.duration) * 100;
    e.target.style.background = 'linear-gradient(to right, var(--color-primary, #595ae2) 0%, var(--color-primary, #595ae2) ' + value +'%, var(--color-base-3, #d9d9d9) ' + value + '%, var(--color-base-3, #d9d9d9) 100%)'
  }

  _playBarChangeHandler(e) {
    let position = this.startTime + e.target.value;
    jwplayer().seek(position);
  }

  _timeFormatter(current, duration) {
    let curMin = parseInt(current / 60);
    let curSec = current % 60;
    let remMin = parseInt((duration - current) / 60);
    let remSec = (duration - current) % 60;
    
    curMin = formatter(curMin);
    curSec = formatter(curSec);
    remMin = formatter(remMin);
    remSec = formatter(remSec);

    let currentTime = curMin + ':' + curSec;
    let remainingTime = '- ' + remMin + ':' + remSec;

    function formatter(num) {
      if (num < 10) return '0' + num;
      else return num;
    }

    return [currentTime, remainingTime];
  }
}
