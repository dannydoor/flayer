class Controller {
  constructor(
    initObj = null,
    initContext = null,
    initShuffle = false,
    initRepeat = false
  ) {
    this.playButton = window["play-or-pause"];
    this.prevButton = window["prev-button"];
    this.prevSongTitle = this.prevButton.querySelector(".tooltip strong");
    this.prevSongArtist = this.prevButton.querySelector(".tooltip span");
    this.nextButton = window["next-button"];
    this.nextSongTitle = this.nextButton.querySelector(".tooltip strong");
    this.nextSongArtist = this.nextButton.querySelector(".tooltip span");
    this.repeatButton = window["repeat-button"];
    this.shuffleButton = window["shuffle-button"];
    this.playBar = window["play-bar"];
    this.volumeBar = window["volume-bar"];
    this.currentTime = window["current-time"];
    this.remainingTime = window["remaining-time"];
    this.muteButton = window["mute-button"];
    this.songTitleSection = window["curr-song-title"];
    this.songArtistSection = window["curr-song-artist"];
    this.openPlaylistButton = window["open-curr-playlist"];
    this.currentPlaylist =
      this.openPlaylistButton.querySelector(".tooltip strong");
    this.likeButton = window["like-this-button"];
    this.meatballsButton = window["meatball-button"];

    this.isShuffled = initShuffle;
    this.isRepeat = initRepeat;
    this.timerID = null;
    this._setupOptions = {
      autostart: true,
      width: "100%",
      mute: false,
      controls: false,
    };

    this._updatePlayBar = this._updatePlayBar.bind(this);
    this._updateMuteState = this._updateMuteState.bind(this);
    this._updateControlBar = this._updateControlBar.bind(this);
    this._updateVolumeBar = this._updateVolumeBar.bind(this);
    this._updateProperties = this._updateProperties.bind(this);
    this._letIncreaseStop = this._letIncreaseStop.bind(this);
    this._letPlaybarIncrease = this._letPlaybarIncrease.bind(this);
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
    let inputEvent = new InputEvent("input");

    this.playBar.addEventListener("input", playInput);
    this.playBar.addEventListener("change", playChange);
    this.playBar.dispatchEvent(inputEvent);

    let muteHandler = this._muteButtonHandler;
    this.muteButton.onclick = muteHandler;
  }

  setupPlayer(obj, context) {
    if (obj) {
      // 마지막 세션 세팅
      this._updateProperties(obj, context);
      this._setupOptions.file = this.URL;

      let options = this._setupOptions;
      let update = this._updateControlBar;
      let startTime = this.startTime;

      jwplayer("video").setup(options);
      jwplayer().once("beforePlay", () => {
        jwplayer().seek(startTime);
        update();
      });

      this.setPlayerHandlers();
      this._updatePlayerHandler();
    } else {
      // 초기화
      this._setupOptions.file =
        "https://media.dema.mil.kr/mediavod/_definst_/smil:dematv/202205/9617396921029532/9617396921029532.smil/playlist.m3u8";
      let options = this._setupOptions;
      jwplayer("video").setup(options);
      jwplayer().once("ready", () => jwplayer().stop());

      // 컨트롤바 비활성화
      this._toggleDisabledStatus("control", true);
      this._toggleDisabledStatus("bars", true);
      this._toggleDisabledStatus("info", true);

      // 창 정보 비우기
      this.playBar.setAttribute("min", 0);
      this.playBar.setAttribute("max", 0);
      this.playBar.value = 0;
      this.currentTime.innerHTML = "00:00";
      this.remainingTime.innerHTML = "- 00:00";
      this.songTitleSection.innerHTML = "";
      this.songArtistSection.innerHTML = "";

      // 핸들러 달기
      this.setPlayerHandlers();
    }
    let volumeInput = this._volumeBarHandler;
    let volumeChange = this._volumeBarChangeHandler;
    let inputEvent = new InputEvent("input");

    this.volumeBar.setAttribute("mute", false);
    this.volumeBar.addEventListener("input", volumeInput);
    this.volumeBar.addEventListener("change", volumeChange);
    this.volumeBar.dispatchEvent(inputEvent);
  }

  loadMusic(obj, context) {
    jwplayer().off("time");
    this._updateProperties(obj, context);

    let startTime = this.startTime;
    let file = { file: this.URL };

    jwplayer().once("beforePlay", () => jwplayer().seek(startTime));
    jwplayer().load(file);

    this._updatePlayerHandler();
    this._updateControlBar();
  }

  _letIncreaseStop() {
    if (!this.timerID) return;
    clearInterval(this.timerID);
  }

  _letPlaybarIncrease() {
    if (this.timerID) return;
    let boundIncrease = increase.bind(this);
    this.timerID = setInterval(boundIncrease, 1000);

    function increase() {
      this.playBar.stepUp();
      [this.currentTime.innerHTML, this.remainingTime.innerHTML] =
        this._timeFormatter(this.playBar.value);
    }
  }

  _updateControlBar() {
    let isLiked = this.isLiked ? "liked" : "";
    let isContextValid = this.context.startsWith("playlist:") ? true : false;
    let playlistID;
    let playlistName = null;
    if (isContextValid) playlistID = this.context.slice(9);

    this.playBar.setAttribute("max", parseInt(this.duration));
    this.playBar.value = 0;
    [this.currentTime.innerHTML, this.remainingTime.innerHTML] =
      this._timeFormatter(0, this.duration);
    this.volumeBar.value = jwplayer().getVolume();

    this.songTitleSection.innerHTML = this.title;
    this.songArtistSection.innerHTML = this.artist;

    this.likeButton.className = isLiked;

    if (!isContextValid) {
      this._toggleDisabledStatus("playlist", true);
    }
  }

  _updatePlayBar() {
    let currTime = jwplayer().getPosition() - this.startTime;
    if (this.playBar.value == currTime) return;
    this.playBar.value = currTime;
    [this.currentTime.innerHTML, this.remainingTime.innerHTML] =
      this._timeFormatter(currTime, this.duration);
  }

  _updateVolumeBar() {
    let currVolume = jwplayer().getVolume();
    if (this.volumeBar.value == currVolume) return;
    this.volumeBar.value = currVolume;
  }

  _updateMuteState() {
    let currMuteState = jwplayer().getMute();
    let userMuteState = this.volumeBar.getAttribute("mute");

    if (userMuteState == currMuteState) return;
    else {
      this.volumeBar.setAttribute("mute", currMuteState);
      this._toggleVolumeMuteState(currMuteState);
    }
  }

  _updateTooltip() {
    let [, prevObj] = queueManager.returnPrevInfo();
    let [, nextObj] = queueManager.returnNextInfo();
    let currPlaylistName;

    if (prevObj) {
      [this.prevSongTitle.innerHTML, this.prevSongArtist.innerHTML] = [
        prevObj.title,
        prevObj.artist,
      ];
    } else {
      [this.prevSongTitle.innerHTML, this.prevSongArtist.innerHTML] = [
        "이전 곡이",
        "존재하지 않습니다",
      ];
    }

    if (nextObj) {
      [this.nextSongTitle.innerHTML, this.nextSongArtist.innerHTML] = [
        nextObj.title,
        nextObj.artist,
      ];
    } else {
      [this.nextSongTitle.innerHTML, this.nextSongArtist.innerHTML] = [
        "다음 곡이",
        "존재하지 않습니다",
      ];
    }
  }

  _updatePlayerHandler() {
    let onTimeHandler = this._onTime;
    jwplayer().on("time", onTimeHandler);
  }

  _updateProperties(obj, context) {
    this.musicID = obj.id;
    this.title = obj.title;
    this.artist = obj.artist;
    this.context = context;
    this.URL =
      "https://media.dema.mil.kr/mediavod/_definst_/smil:dematv/" +
      obj.src +
      "/playlist.m3u8";
    // this.URL = 'http://media.dema.mnd.mil:1935/vod/_definst_/mp4:DIMOS/' + obj.src + '/playlist.m3u8'; 인트라넷 버전
    this.startTime = obj.startTime;
    this.endTime = obj.endTime;
    this.duration = obj.duration;
    this.isLiked = obj.isLiked;
    this.referencedObj = obj;
    this.referencedObj.isPlaying = true;
  }

  setPlayerHandlers() {
    let onSeekHandler = this._updatePlayBar;
    let onPlayHandler = this._onPlay;
    let onPauseHandler = this._onPause;
    let onBufferHandler = this._onBuffer;
    let onCompleteHandler = this._onComplete;
    let onVolumeHandler = this._updateVolumeBar;
    let onMuteHandler = this._updateMuteState;

    jwplayer().on("seek", onSeekHandler);
    jwplayer().on("play", onPlayHandler);
    jwplayer().on("pause", onPauseHandler);
    jwplayer().on("buffer", onBufferHandler);
    jwplayer().on("complete", onCompleteHandler);
    jwplayer().on("volume", onVolumeHandler);
    jwplayer().on("mute", onMuteHandler);
  }

  _isItPlayedEnough() {
    let currTime = this.playBar.value;
    if (currTime > 60) return true;
    else return false;
  }

  _toggleControlStatus() {
    let isPlaying = jwplayer("video").getState();
    let currState =
      this.playButton.className == "play"
        ? "paused"
        : this.playButton.className == "pause"
        ? "playing"
        : "undefined";

    if (isPlaying == "buffering") {
      this._toggleDisabledStatus("control", true);
      return;
    } else if (isPlaying == "playing" && currState != isPlaying) {
      this.playButton.className = "pause";
    } else if (isPlaying == "paused" && currState != isPlaying) {
      this.playButton.className = "play";
    }

    this._toggleDisabledStatus("control", false);
  }

  _toggleVolumeMuteState(currMuteState) {
    let inputEvent = new InputEvent("input");
    if (currMuteState) {
      this.volumeBar.removeEventListener("input", this._volumeBarHandler);
      this.volumeBar.addEventListener("input", this._volumeBarHandlerMuted);
      this.volumeBar.dispatchEvent(inputEvent);
      this.volumeBar.disabled = true;
    } else {
      this.volumeBar.removeEventListener("input", this._volumeBarHandlerMuted);
      this.volumeBar.addEventListener("input", this._volumeBarHandler);
      this.volumeBar.dispatchEvent(inputEvent);
      this.volumeBar.disabled = false;
    }
  }

  _toggleDisabledStatus(node, bool) {
    switch (node) {
      case "control": {
        this.playButton.disabled = bool;
        this.nextButton.disabled = bool;
        this.prevButton.disabled = bool;
        break;
      }
      case "bars": {
        this.playBar.disabled = bool;
        this.volumeBar.disabled = bool;
        this.muteButton.disabled = bool;
        break;
      }
      case "playlist": {
        this.openPlaylistButton.disabled = bool;
        break;
      }
      case "info": {
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
    if (oldstate === "buffering") {
      this._toggleControlStatus();
    }
    this._letPlaybarIncrease();
  }

  _onPause(e) {
    let oldstate = e.oldstate;
    if (oldstate === "buffering") {
      this._toggleControlStatus();
    }
    this._letIncreaseStop();
    this._updatePlayBar();
  }

  _onTime(e) {
    let startTime = this.startTime;
    let endTime = this.endTime;
    let currTime = e.position;

    if (currTime < startTime) {
      jwplayer().seek(startTime);
    } else if (currTime >= endTime) {
      if (this.isRepeat == "one") jwplayer().seek(startTime);
      else this.nextButton.click();
    }
  }

  _onBuffer(e) {
    let oldstate = e.oldstate;
    if (oldstate === "playing") {
      this._toggleControlStatus();
    }
  }

  _onComplete() {
    let startTime = this.startTime;
    if (this.isRepeat == "one") jwplayer().seek(startTime);
    else this.nextButton.click();
  }

  _onPrev() {
    // 이전 곡이 없다면 시작 시간으로 이동.
    let [prevElement, prevObj, prevContext] = queueManager.returnPrevInfo();
    let newPrevElement = prevElement.previousElementSibling;
    let newNextElement = prevElement.nextElementSibling;

    if (!prevElement) {
      jwplayer().seek(this.startTime);
      return;
    }

    let isItPlayedEnough = this._isItPlayedEnough();

    // 1분 이상 재생 시 재생 횟수 더하고, 기록 스택에 추가
    if (isItPlayedEnough) {
      this.referencedObj.playedTime++;
      queueManager.pushRecordStack(this.referencedObj);
    }

    // 현재 곡 playing 속성 제거
    this.referencedObj.isPlaying = false;
    document.querySelectorAll(".playing").forEach((item) => {
      item.classList.remove("playing");
    });

    // 이전 곡 불러오기
    this.loadMusic(prevObj, prevContext);
    let prevID = this.musicID;
    prevElement.classList.remove("prev");
    document.querySelectorAll(`[music-id=${prevID}]`).forEach((item) => {
      item.classList.add("playing");
    });

    // next prev 속성 업데이트
    let nextElement = queueManager.returnNextInfo();
    if (nextElement) {
      nextElement.classList.remove("next");
    }

    if (newPrevElement) newPrevElement.classList.add("prev");
    if (newNextElement) newNextElement.classList.add("next");

    queueManager.correctAttribute();

    // 툴팁 업데이트
    this._updateTooltip();
  }

  _onNext() {
    let isItPlayedEnough = this._isItPlayedEnough();

    // 1분 이상 재생 시 재생 횟수 더하고, 기록 스택에 추가
    if (isItPlayedEnough) {
      this.referencedObj.playedTime++;
      queueManager.pushRecordStack(this.referencedObj);
    }

    // 현재 곡 playing 속성 제거
    this.referencedObj.isPlaying = false;
    document.querySelectorAll(".playing").forEach((item) => {
      item.classList.remove("playing");
    });

    // next 속성 곡 정보 불러오기
    let [nextElement, nextObj, nextContext] = queueManager.returnNextInfo();
    let newPrevElement = nextElement.previousElementSibling;
    let newNextElement = nextElement.nextElementSibling;

    this.loadMusic(nextObj, nextContext);
    let nextID = this.musicID;
    nextElement.classList.remove("next");
    document.querySelectorAll(`[music-id=${nextID}]`).forEach((item) => {
      item.classList.add("playing");
    });

    // next, prev 속성 업데이트
    let prevElement = queueManager.returnPrevInfo();
    if (prevElement) {
      prevElement.classList.remove("prev");
    }

    if (newPrevElement) newPrevElement.classList.add("next");
    if (newNextElement) newNextElement.classList.add("prev");

    queueManager.correctAttribute();

    // 툴팁 정보 업데이트
    this._updateTooltip();
  }

  _muteButtonHandler() {
    let currMuteState = this.volumeBar.getAttribute("mute");
    currMuteState = !currMuteState;
    this._toggleVolumeMuteState(currMuteState);
  }

  _volumeBarHandler(e) {
    let value = e.target.value;
    e.target.style.background =
      "linear-gradient(to right, var(--color-primary, #595ae2) 0%, var(--color-primary, #595ae2) " +
      value +
      "%, var(--color-base-3, #d9d9d9) " +
      value +
      "%, var(--color-base-3, #d9d9d9) 100%)";
  }

  _volumeBarHandlerMuted(e) {
    let value = e.target.value;
    e.target.style.background =
      "linear-gradient(to right, var(--color-ceil-2, #A9A9A9) 0%, var(--color-ceil-2, #A9A9A9) " +
      value +
      "%, var(--color-base-3, #d9d9d9) " +
      value +
      "%, var(--color-base-3, #d9d9d9) 100%)";
  }

  _volumeBarChangeHandler(e) {
    let volume = e.target.value;
    jwplayer().setVolume(volume);
  }

  _playBarHandler(e) {
    let value = e.target.value;
    value = (value / this.duration) * 100;
    e.target.style.background =
      "linear-gradient(to right, var(--color-primary, #595ae2) 0%, var(--color-primary, #595ae2) " +
      value +
      "%, var(--color-base-3, #d9d9d9) " +
      value +
      "%, var(--color-base-3, #d9d9d9) 100%)";
  }

  _playBarChangeHandler(e) {
    let position = this.startTime + e.target.value;
    jwplayer().seek(position);
  }

  _debounce(func, ms) {
    let timeout;
    return function () {
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

      setTimeout(function () {
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

    let currTime = curMin + ":" + curSec;
    let remainingTime = "- " + remMin + ":" + remSec;

    function formatter(num) {
      if (num < 10) return "0" + num;
      else return num;
    }

    return [currTime, remainingTime];
  }
}
