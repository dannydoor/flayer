class Controller {
  constructor(initObj = null, initContext = null, initShuffle = false, initRepeat = false) {
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

    this.isShuffled = initShuffle;
    this.isRepeat = initRepeat;
    this.timestamp = null;
    this._setupOptions = {
      'autostart': true,
      'width': '100%',
      'mute': false,
      'controls': false,
    }

    this._updatePlayBar = this._updatePlayBar.bind(this);
    this._updateMuteState = this._updateMuteState.bind(this);
    this._updateControlBar = this._updateControlBar.bind(this);
    this._updateVolumeBar = this._updateVolumeBar.bind(this);
    this._updateProperties = this._updateProperties.bind(this);
    this._onPlay = this._onPlay.bind(this);
    this._onPause = this._onPause.bind(this);
    this._onBuffer = this._onBuffer.bind(this);
    this._onTime = this._onTime.bind(this);
    this._onComplete = this._onComplete.bind(this);
    this._playBarHandler = this._playBarHandler.bind(this);
    this._playBarChangeHandler = this._playBarChangeHandler.bind(this);
    this._muteButtonHandler = this._muteButtonHandler.bind(this);
    
    this.setupPlayer(initObj, initContext);

    let playInput = this._playBarHandler;
    let playChange = this._playBarChangeHandler;
    let inputEvent = new InputEvent('input');

    this.playBar.addEventListener('input', playInput);
    this.playBar.addEventListener('change', playChange);
    this.playBar.dispatchEvent(inputEvent);

    let muteHandler = this._muteButtonHandler;
    this.muteButton.onclick = muteHandler;
  }

  _updateControlBar() {
    let isLiked = this.isLiked ? 'liked' : '';
    let isContextValid = this.context.startsWith('playlist:') ? true : false;
    let playlistID;
    let playlistName = null;
    if (isContextValid) playlistID = this.context.slice(9);

    this.playBar.setAttribute('max', parseInt(this.duration));
    this.playBar.value = 0;
    [this.currentTime.innerHTML, this.remainingTime.innerHTML] = this._timeFormatter(0, this.duration);
    this.volumeBar.value = jwplayer().getVolume();

    this.songTitleSection.innerHTML = this.title;
    this.songArtistSection.innerHTML = this.artist
    
    this.likeButton.className = isLiked;

    if (!isContextValid) {
      this._toggleDisabledStatus('playlist', true);
      playlistName = playlistManager.getPlaylistByID(playlistID); // 플레이리스트 이름 접근
      this.openPlaylistButton.setAttribute('data-tooltip', '재생 중인 플레이리스트: ' + playlistName);
    }
  }

  _updatePlayBar() {
    let currentTime = jwplayer().getPosition() - this.startTime;
    if (this.playBar.value == currentTime) return;
    this.playBar.value = currentTime;
    [this.currentTime.innerHTML, this.remainingTime.innerHTML] = this._timeFormatter(currentTime, this.duration);
  }

  _updateVolumeBar() {
    let currentVolume = jwplayer().getVolume();
    if (this.volumeBar.value == currentVolume) return;
    this.volumeBar.value = currentVolume;
  }

  _updateMuteState() {
    let currentMuteState = jwplayer().getMute();
    let userMuteState = this.volumeBar.getAttribute('mute')

    if (userMuteState == currentMuteState) return;
    else {
      this.volumeBar.setAttribute('mute', currentMuteState);
      this._toggleVolumeMuteState(currentMuteState);
    }
  }

  _updatePlayerHandler() {
    let onTimeHandler = this._onTime;
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

      let options = this._setupOptions;
      let update = this._updateControlBar;
      let startTime = this.startTime;

      jwplayer('video').setup(options);
      jwplayer().once('beforePlay', () => {
        jwplayer().seek(startTime);
        update();
      });

      this.setPlayerHandlers();
      this._updatePlayerHandler();
    } else {
      
      // 초기화
      this._setupOptions.file = "https://media.dema.mil.kr/mediavod/_definst_/smil:dematv/202205/9617396921029532/9617396921029532.smil/playlist.m3u8";
      let options = this._setupOptions;
      jwplayer('video').setup(options);
      jwplayer().once('ready', () => jwplayer().stop());

      // 컨트롤바 비활성화
      this._toggleDisabledStatus('control', true);
      this._toggleDisabledStatus('bars', true);
      this._toggleDisabledStatus('info', true);

      // 창 정보 비우기
      this.playBar.setAttribute('min', 0);
      this.playBar.setAttribute('max', 0);
      this.playBar.value = 0;
      this.currentTime.innerHTML = '00:00';
      this.remainingTime.innerHTML = '- 00:00';
      this.songTitleSection.innerHTML = '';
      this.songArtistSection.innerHTML = '';

      // 핸들러 달기
      this.setPlayerHandlers();
    }
    let volumeInput = this._volumeBarHandler;
    let volumeChange = this._volumeBarChangeHandler;
    let inputEvent = new InputEvent('input');

    this.volumeBar.setAttribute('mute', false);
    this.volumeBar.addEventListener('input', volumeInput);
    this.volumeBar.addEventListener('change', volumeChange);
    this.volumeBar.dispatchEvent(inputEvent);
  }

  loadMusic(obj, context) {
    jwplayer().off('time');
    this._updateProperties(obj, context);

    let startTime = this.startTime;
    let file = {'file': this.URL};

    jwplayer().once('beforePlay', () => jwplayer().seek(startTime));
    jwplayer().load(file);

    this._updatePlayerHandler();
    this._updateControlBar();
  }

  setPlayerHandlers() {
    let onSeekHandler = this._updatePlayBar;
    let onPlayHandler = this._onPlay;
    let onPauseHandler = this._onPause;
    let onBufferHandler = this._onBuffer;
    let onCompleteHandler = this._onComplete;
    let onVolumeHandler = this._updateVolumeBar;
    let onMuteHandler = this._updateMuteState;

    jwplayer().on('seek', onSeekHandler);
    jwplayer().on('play', onPlayHandler);
    jwplayer().on('pause', onPauseHandler);
    jwplayer().on('buffer', onBufferHandler);
    jwplayer().on('complete', onCompleteHandler);
    jwplayer().on('volume', onVolumeHandler);
    jwplayer().on('mute', onMuteHandler);
  }

  _toggleControlStatus() {
    let isPlaying = jwplayer('video').getState();
    let currState = (this.playButton.className == 'play') ? 'paused' : (this.playButton.className == 'pause') ? 'playing' : 'undefined';
    
    if (isPlaying == 'buffering') {
      this._toggleDisabledStatus('control', true);
      return;
    } else if (isPlaying == 'playing' && currState != isPlaying) {
      this.playButton.className = 'pause';
    } else if (isPlaying == 'paused' && currState != isPlaying) {
      this.playButton.className = 'play';
    }

    this._toggleDisabledStatus('control', false);
  }

  _toggleVolumeMuteState(currentMuteState) {
    let inputEvent = new InputEvent('input')
    if (currentMuteState) {
        this.volumeBar.removeEventListener('input', this._volumeBarHandler);
        this.volumeBar.addEventListener('input', this._volumeBarHandlerMuted);
        this.volumeBar.dispatchEvent(inputEvent);
    } else {
      this.volumeBar.removeEventListener('input', this._volumeBarHandlerMuted);
      this.volumeBar.addEventListener('input', this._volumeBarHandler);
      this.volumeBar.dispatchEvent(inputEvent);
    }
  }

  _toggleDisabledStatus(node, bool) {
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

  _onPlay(e) {
    let oldstate = e.oldstate;
    if (oldstate === 'buffering') {
      this._toggleControlStatus();
    }
  }

  _onPause(e) {
    let oldstate = e.oldstate;
    if (oldstate === 'buffering') {
      this._toggleControlStatus();
    }
  }

  _onTime(e) {
    let startTime = this.startTime;
    let endTime = this.endTime;
    let currentTime = e.position;

    if (currentTime < startTime) {
      jwplayer().seek(startTime);
    } else if (currentTime >= endTime) {
      if (this.isRepeat == 'one') jwplayer().seek(startTime);
      else window['next-button'].click();
    }
  }

  _onBuffer(e) {
    let oldstate = e.oldstate;
    if (oldstate === 'playing') {
      this._toggleControlStatus();
    }
  }

  _onComplete() {
    let startTime = this.startTime;
    if (this.isRepeat == 'one') jwplayer().seek(startTime);
    else this.nextButton.click();
  }

  _muteButtonHandler() {
    let currentMuteState = this.volumeBar.getAttribute('mute');
    currentMuteState = !currentMuteState;
    this._toggleVolumeMuteState(currentMuteState);
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

  _debounce(func, ms) {
    let timeout;
    return function() {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, arguments), ms);
    };
  }

  _throttle(func, ms) {

    let isThrottled = false,
      savedArgs,
      savedThis;
  
    function wrapper() {
  
      if (isThrottled) {
        savedArgs = arguments;
        savedThis = this;
        return;
      }
  
      func.apply(this, arguments);
  
      isThrottled = true;
  
      setTimeout(function() {
        isThrottled = false;
        if (savedArgs) {
          wrapper.apply(savedThis, savedArgs);
          savedArgs = savedThis = null;
        }
      }, ms);
    }
  
    return wrapper;
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
