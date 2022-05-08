class Controller {
  constructor(initObj = null, initContext = null, initShuffle = false, initRepeat = false) {
    this.isShuffled = initShuffle;
    this.isRepeat = initRepeat;
    this.timestamp = null;
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

  updateControlBar() {
    let currentTime = jwplayer().getPosition() - this.startTime;
    let isLiked = this.isLiked ? 'liked' : '';
    let isContextValid = this.context.startsWith('playlist:') ? true : false;

    this.playBar.setAttribute('step', parseInt(this.duration));
    this.playBar.setAttribute('value', 0);
    [this.currentTime.innerHTML, this.remainingTime.innerHTML] = this.timeFormatter(currentTime, this.duration);
    this.volumeBar.setAttribute('value', jwplayer().getVolume());

    this.songTitleSection.innerHTML = this.title;
    this.songArtistSection.innerHTML = this.artist
    
    this.likeButton.className = isLiked;

    if (!isContextValid) this.toggleDisabledStatus('playlist', true);
  }

  updatePlayBar() {

  }

  updateVolumeBar() {

  }

  updateMuteState() {

  }

  updateProperties(obj, context) {
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
      this.updateProperties(obj, context);
      this._setupOptions.file = this.URL;
      jwplayer('video').setup.call(this, this._setupOptions);
      jwplayer().once.call(this, 'beforePlay', () => jwplayer().seek(this.startTime));
      this.setPlayerHandlers();
      this.updatePlayerHandler();
      this.updateControlBar();
      return;
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
      return;
    }
  }

  loadMusic(obj) {
    jwplayer().off('time');
    this.updateProperties(obj);

    let file = {'file': this.URL};

    jwplayer().once.call(this, 'beforePlay', () => jwplayer().seek(this.startTime));
    jwplayer().load(file);

    this.updatePlayerHandler();
    this.updateControlBar();
  }

  setPlayerHandlers() {
    jwplayer().on.call(this, 'seek', e => {
      let currentTime = e.offset;
      this.updatePlayBar(currentTime);
    });

    jwplayer().on.call(this, 'play', e => {
      let oldstate = e.oldstate;
      if (oldstate === 'buffering') {
        this.toggleDisabledStatus('control', false);
        this.toggleControlStatus();
      }
    });

    jwplayer().on.call(this, 'pause', e => {
      let oldstate = e.oldstate;
      if (oldstate === 'buffering') {
        this.toggleDisabledStatus('control', false);
        this.toggleControlStatus();
      }
    });

    jwplayer().on.call(this, 'buffer', e => {
      let oldstate = e.oldstate;
      if (oldstate === 'playing') {
        this.toggleDisabledStatus('control', true);
        this.toggleControlStatus();
      }
    });

    jwplayer().on('complete', e => {
      window['next-button'].click();
    });

    jwplayer().on.call(this, 'volume', e => {
      this.updateVolumeBar(e.volume);
    });

    jwplayer().on.call(this, 'mute', e => {
      this.updateMuteState(e.mute);
    });
  }

  updatePlayerHandler() {
    let st = this.startTime;
    let et = this.endTime;
    jwplayer().on('time', function(e) {
      let startTime = st;
      let endTime = et;
      let currentTime = e.position;

      if (currentTime < startTime) {
        jwplayer().seek(startTime);
      } else if (currentTime >= endTime) {
        window['next-button'].click();
      }
    });
  }

  toggleControlStatus() {
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

  timeFormatter(current, duration) {
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
