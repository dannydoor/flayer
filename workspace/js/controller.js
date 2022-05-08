class Controller {
  constructor() {

    this._options = {
      autostart: true,
      width: '100%',
      mute: false,
      controls: false,
    }

    this.title;
    this.artist;
    this.srcURL;
    this.startTime;
    this.endTime;
    this.duration;
    this.isLiked;
    this.musicID;

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
    this.songTitleSec = window['curr-song-title'];
    this.songArtistSec = window['curr-song-artist'];
    this.openPlaylistButton = window['open-curr-playlist'];
    this.likeButton = window['like-this-button'];
    this.meatballsButton = window['meatball-button'];
  }

  loadMusic(obj) {
    this.title = obj.title;
    this.artist = obj.artist;
    this.URL = 'http://media.dema.mnd.mil:1935/vod/_definst_/mp4:DIMOS/' + obj.src + '/playlist.m3u8';
    this.startTime = obj.src;
    this.endTime = obj.endTime;
    this.duration = obj.duration;
    this.isLiked = obj.isLiked;

    this._options.title = this.title;
    this._options.file = this.URL;
    //on(time), on()
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

  toggleDisabledStatus(node, value) {
    switch(node) {
      case 'control' : {
        this.playButton.disabled = value;
        this.nextButton.disabled = value;
        this.prevButton.disabled = value;
        break;
      }
      case 'bars' : {
        this.playBar.disabled = value;
        this.volumeBar.disabled = value;
        this.muteButton.disabled = value;
        break;
      }
      case 'playlist' : {
        this.openPlaylistButton.disabled = value;
        break;
      }
      case 'like' : {
        this.likeButton.disabled = value;
      }
    }
  }
}
