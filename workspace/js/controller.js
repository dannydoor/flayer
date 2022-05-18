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
    this.currentInfo = {
      id,
      title,
      artist,
      context,
      url,
      startTime,
      endTime,
      duration,
      isLiked,
      reference,
    };

    this._mediaSessionObj = {
      title,
      artist,
      artwork: [
        {
          src: "../assets/img/artworks/artwork@96px.png",
          sizes: "96x96",
          type: "image/png",
        },
        {
          src: "../assets/img/artworks/artwork@128px.png",
          sizes: "128x128",
          type: "image/png",
        },
        {
          src: "../assets/img/artworks/artwork@192px.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "../assets/img/artworks/artwork@256px.png",
          sizes: "256x256",
          type: "image/png",
        },
        {
          src: "../assets/img/artworks/artwork@384px.png",
          sizes: "384x382",
          type: "image/png",
        },
        {
          src: "../assets/img/artworks/artwork@512px.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    };

    this.updateMusicToPlay = this.updateMusicToPlay.bind(this);
    this._updatePlayBar = this._updatePlayBar.bind(this);
    this._updateMuteState = this._updateMuteState.bind(this);
    this._updateMediaSession = this._updateMediaSession.bind(this);
    this._updateControlBar = this._updateControlBar.bind(this);
    this._updateVolumeBar = this._updateVolumeBar.bind(this);
    this._updateProperties = this._updateProperties.bind(this);
    this._updatePrevAndNext = this._updatePrevAndNext.bind(this);
    this.updateTooltip = this.updateTooltip.bind(this);
    this._letIncreaseStop = this._letIncreaseStop.bind(this);
    this._letPlaybarIncrease = this._letPlaybarIncrease.bind(this);
    this._onPlay = this._onPlay.bind(this);
    this._onPause = this._onPause.bind(this);
    this._onBuffer = this._onBuffer.bind(this);
    this._onTime = this._onTime.bind(this);
    this._onComplete = this._onComplete.bind(this);
    this._playBarHandler = this._playBarHandler.bind(this);
    this._playBarChangeHandler = this._playBarChangeHandler.bind(this);
    this._repeatButtonHandler = this._repeatButtonHandler.bind(this);
    this._shuffleButtonHandler = this._shuffleButtonHandler.bind(this);
    this._muteButtonHandler = this._muteButtonHandler.bind(this);

    this.setupPlayer(initObj, initContext);

    this.prevButton.onmouseover = returnBindFree(this._onMouseOverTooltip);
    this.nextButton.onmouseover = returnBindFree(this._onMouseOverTooltip);
    this.openPlaylistButton.onmouseover = returnBindFree(
      this._onMouseOverTooltip
    );
    this.prevButton.onmouseleave = returnBindFree(this._onMouseLeaveTooltip);
    this.nextButton.onmouseleave = returnBindFree(this._onMouseLeaveTooltip);
    this.openPlaylistButton.onmouseleave = returnBindFree(
      this._onMouseLeaveTooltip
    );
    this.prevButton.onmousedown = returnBindFree(this._onMouseDownSeekForeward);
    this.nextButton.onmousedown = returnBindFree(this._onMouseDownSeekBackward);
    this.prevButton.onmouseup = returnBindFree(this._onMouseUpSeek);
    this.nextButton.onmouseup = returnBindFree(this._onMouseUpSeek);
    this.repeatButton.onclick = returnBindFree(this._repeatButtonHandler);
    this.shuffleButton.onclick = returnBindFree(this._shuffleButtonHandler);
    this.muteButton.onclick = returnBindFree(this._muteButtonHandler);

    let playInput = this._playBarHandler;
    let playChange = this._playBarChangeHandler;
    let inputEvent = new InputEvent("input");

    this.playBar.addEventListener("input", playInput);
    this.playBar.addEventListener("change", playChange);
    this.playBar.dispatchEvent(inputEvent);
  }

  setupPlayer(obj, context) {
    if (obj) {
      // 마지막 세션 세팅
      this._updateProperties(obj, context);
      this._setupOptions.file =
        "https://media.dema.mil.kr/mediavod/_definst_/smil:dematv/" +
        this.currentInfo.url +
        "/playlist.m3u8";

      let options = this._setupOptions;
      let updateMediaSession = this._updateMediaSession;
      let startTime = this.currentInfo.startTime;

      jwplayer("video").setup(options);
      jwplayer().once("beforePlay", () => {
        jwplayer().seek(startTime);
        updateMediaSession();
      });

      this.setPlayerHandlers();
      this._updateControlBar();
      this._updatePlayerHandler();
      this.updateTooltip(true, true, true);
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
      this.updateTooltip(true, true, true);
    }
    let volumeInput = this._volumeBarHandler;
    let volumeChange = this._volumeBarChangeHandler;
    let inputEvent = new InputEvent("input");

    this.volumeBar.setAttribute("mute", false);
    this.volumeBar.addEventListener("input", volumeInput);
    this.volumeBar.addEventListener("change", volumeChange);
    this.volumeBar.dispatchEvent(inputEvent);
  }

  playMusic() {
    let musicToPlay = queueManager.queue.firstElementChild;

    this.updateMusicToPlay(musicToPlay);
    this.updateTooltip(true, true, true);
    queueManager.setPlaylistName();
  }

  loadMusic(obj, context) {
    jwplayer().off("time");
    this._updateProperties(obj, context);

    let startTime = this.currentInfo.startTime;
    let file = {
      file:
        "https://media.dema.mil.kr/mediavod/_definst_/smil:dematv/" +
        this.URL +
        "/playlist.m3u8",
    };

    let updateMediaSession = this._updateMediaSession;

    jwplayer().once("beforePlay", () => {
      jwplayer().seek(startTime);
      updateMediaSession();
    });
    jwplayer().load(file);

    this._updatePlayerHandler();
    this._updateControlBar();
  }

  _letIncreaseStop() {
    if (!this.timerID) return;
    clearInterval(this.timerID);
    this.timerID = null;
  }

  _letPlaybarIncrease() {
    if (this.timerID) return;
    let boundIncrease = increase.bind(this);
    this.timerID = setInterval(boundIncrease, 1000);

    function increase() {
      this.playBar.stepUp();
      [this.currentTime.innerHTML, this.remainingTime.innerHTML] =
        this._timeFormatter(this.playBar.value, this.currentInfo.duration);
    }
  }

  _updateControlBar() {
    let isLiked = this.currentInfo.isLiked ? "liked" : "";
    let isContextValid = this.currentInfo.context.startsWith("playlist:")
      ? true
      : false;

    this.playBar.setAttribute("max", parseInt(this.currentInfo.duration));
    this.playBar.value = 0;
    [this.currentTime.innerHTML, this.remainingTime.innerHTML] =
      this._timeFormatter(0, this.currentInfo.duration);
    this.volumeBar.value = jwplayer().getVolume();

    this.songTitleSection.innerHTML = this.currentInfo.title;
    this.songArtistSection.innerHTML = this.currentInfo.artist;

    this.likeButton.className = isLiked;

    if (!isContextValid) {
      this._toggleDisabledStatus("playlist", true);
    }
  }

  _updatePlayBar() {
    let currTime = jwplayer().getPosition() - this.currentInfo.startTime;
    if (this.playBar.value == currTime) return;
    this.playBar.value = currTime;
    [this.currentTime.innerHTML, this.remainingTime.innerHTML] =
      this._timeFormatter(currTime, this.currentInfo.duration);
  }

  _updateVolumeBar() {
    let currVolume = jwplayer().getVolume();
    if (this.volumeBar.value == currVolume) return;
    this.volumeBar.value = currVolume;
  }

  updateMusicToPlay(musicToPlay) {
    this.currentInfo.reference.isPlaying = false;
    document.querySelectorAll(".playing").forEach((item) => {
      item.classList.remove("playing");
    });
    document.querySelectorAll(".current").forEach((item) => {
      item.classList.remove("current");
    });

    this.loadMusic(musicToPlay.musicObj, musicToPlay.context);
    let musicID = this.currentInfo.id;
    musicToPlay.classList.add("current");
    document.querySelectorAll(`[music-id=${musicID}]`).forEach((item) => {
      item.classList.add("playing");
    });

    this.currentMusic = musicToPlay;
    queueManager.makeUpLibraryItem();
    this._updatePrevAndNext(musicToPlay);
  }

  _updatePrevAndNext(currentMusic) {
    this.prevMusic = currentMusic.previousElementSibling
      ? currentMusic.previousElementSibling
      : this.isRepeat
      ? queueManager.queue.lastElementChild
      : undefined;
    this.nextMusic = currentMusic.nextElementSibling
      ? currentMusic.nextElementSibling
      : this.isRepeat
      ? queueManager.queue.firstElementChild
      : undefined;
  }

  _updateMuteState() {
    let currMuteState = jwplayer().getMute();
    let userMuteState = this.volumeBar.getAttribute("mute");

    if (userMuteState == currMuteState) return;
    else {
      this.volumeBar.setAttribute("mute", currMuteState);
      this._toggleVolumeBarMuteState(currMuteState);
    }
  }

  _updateMediaSession() {
    this._mediaSessionObj.title = this.currentInfo.title;
    this._mediaSessionObj.artist = this.currentInfo.artist;
    metadata = this._mediaSessionObj;

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata(metadata);
      navigator.mediaSession.setActionHandler("play", () => {
        jwplayer().play();
        navigator.mediaSession.playbackState = "playing";
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        jwplayer().pause();
        navigator.mediaSession.playbackState = "paused";
      });
      navigator.mediaSession.setActionHandler("previoustrack", () =>
        window("prev-button").click()
      );
      navigator.mediaSession.setActionHandler("nexttrack", () =>
        window("next-button").click()
      );
    }
  }

  updateTooltip(prev = false, next = false, playlist = false) {
    if (prev) {
      let prevObj = this.prevMusic?.musicObj;
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
    }

    if (next) {
      let nextObj = this.nextMusic?.musicObj;
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

    if (playlist) {
      let currPlaylistName = playlistManager.getPlaylistName(
        this.currentInfo.context
      );
      if (currPlaylistName) {
        this.currentPlaylist.innerHTML = currPlaylistName;
      } else {
        this.currentPlaylist.innerHTML = "플레이리스트 재생 중이 아닙니다.";
      }
    }
  }

  _updatePlayerHandler() {
    let onTimeHandler = this._onTime;
    jwplayer().on("time", onTimeHandler);
  }

  _updateProperties(obj, context) {
    this.currentInfo.id = obj.id;
    this.currentInfo.title = obj.title;
    this.currentInfo.artist = obj.artist;
    this.currentInfo.context = context;
    this.currentInfo.url =
      "https://media.dema.mil.kr/mediavod/_definst_/smil:dematv/" +
      obj.src +
      "/playlist.m3u8";
    // this.URL = 'http://media.dema.mnd.mil:1935/vod/_definst_/mp4:DIMOS/' + obj.src + '/playlist.m3u8'; 인트라넷 버전
    this.currentInfo.startTime = obj.startTime;
    this.currentInfo.endTime = obj.endTime;
    this.currentInfo.duration = obj.duration;
    this.currentInfo.isLiked = obj.isLiked;
    this.currentInfo.reference = obj;
    this.currentInfo.reference.isPlaying = true;
  }

  setPlayerHandlers() {
    jwplayer().on("seeked", this._updatePlayBar);
    jwplayer().on("play", this._onPlay);
    jwplayer().on("pause", this._onPause);
    jwplayer().on("buffer", this._onBuffer);
    jwplayer().on("complete", this._onComplete);
    jwplayer().on("volume", this._updateVolumeBar);
    jwplayer().on("mute", this._updateMuteState);
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

  _toggleVolumeBarMuteState(currMuteState) {
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
    let startTime = this.currentInfo.startTime;
    let endTime = this.currentInfo.endTime;
    let currTime = e.position;

    if (currTime < startTime) {
      jwplayer().seek(startTime);
    } else if (currTime >= endTime - 10) {
      this.nextButton.querySelector(".tooltip").classList.add("must-visible");
    } else if (currTime >= endTime) {
      if (this.isRepeat == "one") jwplayer().seek(startTime);
      else this.nextButton.click();
      this.nextButton
        .querySelector(".tooltip")
        .classList.remove("must-visible");
    }
  }

  _onBuffer() {
    this._toggleControlStatus();
  }

  _onComplete() {
    let startTime = this.currentInfo.startTime;
    if (this.isRepeat == "one") jwplayer().seek(startTime);
    else this.nextButton.click();
    this.nextButton.querySelector(".tooltip").classList.remove("must-visible");
  }

  _onPrev() {
    let currPostion = this.playBar.value;

    if (currPostion < 10 || !this.prevMusic) {
      jwplayer().seek(this.currentInfo.startTime);
      return;
    }

    let musicToPlay = this.prevMusic;

    let isItPlayedEnough = this._isItPlayedEnough();

    // 1분 이상 재생 시 재생 횟수 더하고, 기록 스택에 추가
    if (isItPlayedEnough) {
      this.currentInfo.reference.playedTime++;
      queueManager.pushRecordStack(this.currentInfo.reference);
    }

    this.updateMusicToPlay(musicToPlay);
    this.updateTooltip(true, true, true);
    queueManager.setPlaylistName();
  }

  _onNext() {
    let mustStop = false;
    let musicToPlay = this.nextMusic;
    if (!musicToPlay) {
      mustStop = true;
      musicToPlay = queueManager.queue.firstElementChild;
    }

    let isItPlayedEnough = this._isItPlayedEnough();

    // 1분 이상 재생 시 재생 횟수 더하고, 기록 스택에 추가
    if (isItPlayedEnough) {
      this.currentInfo.reference.playedTime++;
      queueManager.pushRecordStack(this.currentInfo.reference);
    }

    this.updateMusicToPlay(musicToPlay);
    this.updateTooltip(true, true, true);
    queueManager.setPlaylistName();

    if (mustStop) jwplayer().stop();
  }

  _onMouseOverTooltip(e) {
    let target = e.target;
    target.timerID = setTimeout(() => makeTooltipVisible(), 1000);

    function makeTooltipVisible() {
      let tooltip = target.querySelector(".tooltip");
      tooltip.classList.add("visible");
    }
  }

  _onMouseLeaveTooltip(e) {
    clearTimeout(e.target.timerID);
    e.target.timerID = null;
    e.target.querySelector(".tooltip").classList.remove("visible");
  }

  _onMouseDownSeekBackward(e) {
    let target = e.target;
    target.timerID = setTimeout(() => {
      target.classList.add("seeking");
      startSeeking();
    }, 2000);

    function startSeeking() {
      let origPosition = jwplayer().getPosition();
      const SEEK_TERM = 5;
      let position = origPosition;
      target.timerID2 = setInterval(seeking, 1000);

      function seeking() {
        position += SEEK_TERM;
        jwplayer().seek(position);
      }
    }
  }

  _onMouseDownSeekForeward(e) {
    let target = e.target;
    target.timerID = setTimeout(() => {
      target.classList.add("seeking");
      startSeeking();
    }, 2000);

    function startSeeking() {
      let origPosition = jwplayer().getPosition();
      const SEEK_TERM = 5;
      let position = origPosition;
      target.timerID2 = setInterval(seeking, 1000);

      function seeking() {
        position -= SEEK_TERM;
        position = position < 0 ? 0 : position;
        jwplayer().seek(position);
      }
    }
  }

  _onMouseUpSeek(e) {
    let target = e.target;
    target.classList.remove("seeking");
    clearTimeout(target.timerID);
    clearInterval(target.timerID2);
    target.timerID = null;
    target.timerID2 = null;
  }

  _repeatButtonHandler() {
    if (!this.isRepeat) {
      this.isRepeat = true;
      this.repeatButton.classList.add("active");
      this._updatePrevAndNext(this.currentMusic);
      this.updateTooltip(true, true);
    } else if (this.isRepeat == "one") {
      this.isRepeat = false;
      this.repeatButton.classList.remove("active");
      this.repeatButton.classList.remove("one");
      this._updatePrevAndNext(this.currentMusic);
      this.updateTooltip(true, true);
    } else {
      this.isRepeat = "one";
      this.repeatButton.classList.add("one");
    }
  }

  _shuffleButtonHandler() {
    this.isShuffled = !this.isShuffled;
    this.shuffleButton.classList.toggle("active");
    if (this.isShuffled) {
      queueManager.shuffleQueue();
      this._updatePrevAndNext(this.currentMusic);
      this.updateTooltip(true, true);
    } else {
      queueManager.restoreQueue();
      this._updatePrevAndNext(this.currentMusic);
      this.updateTooltip(true, true);
    }
  }

  _muteButtonHandler() {
    let currMuteState = this.volumeBar.getAttribute("mute");
    currMuteState = !currMuteState;
    this._toggleVolumeBarMuteState(currMuteState);
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
    value = (value / this.currentInfo.duration) * 100;
    value = value < 0 ? 0 : value;
    e.target.style.background =
      "linear-gradient(to right, var(--color-primary, #595ae2) 0%, var(--color-primary, #595ae2) " +
      value +
      "%, var(--color-base-3, #d9d9d9) " +
      value +
      "%, var(--color-base-3, #d9d9d9) 100%)";
  }

  _playBarChangeHandler(e) {
    let position = this.currentInfo.startTime + e.target.value;
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

    let currentTime = curMin + ":" + curSec;
    let remainingTime = "- " + remMin + ":" + remSec;

    function formatter(num) {
      if (num < 10) return "0" + num;
      else return num;
    }

    return [currentTime, remainingTime];
  }
}

function returnBindFree(func) {
  return func;
}
