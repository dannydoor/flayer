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

    this.initState = null;
    this.isShuffled = initShuffle;
    this.isRepeat = initRepeat;
    this.timerId = null;
    this.seektimerId = null;
    this.seekStarttimerId = null;
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
    this.updateTooltip = this.updateTooltip.bind(this);
    for (let key in this.updates) {
      this.handlers[key] = this.handlers[key].bind(this);
    }
    for (let key in this.handlers) {
      this.handlers[key] = this.handlers[key].bind(this);
    }
    for (let key in this.helpers) {
      this.handlers[key] = this.handlers[key].bind(this);
    }

    this.setupPlayer(initObj, initContext);

    this.prevButton.onmouseover =
      this.nextButton.onmouseover =
      this.openPlaylistButton.onmouseover =
        this.handlers.onMouseOverTooltip;
    this.prevButton.onmouseleave =
      this.nextButton.onmouseleave =
      this.openPlaylistButton.onmouseleave =
        this.handlers.onMouseLeaveTooltip;
    this.prevButton.onmousedown = this.handlers.onMouseDownSeek("prev");
    this.nextButton.onmousedown = this.handlers.onMouseDownSeek("next");
    this.prevButton.onmouseup = this.nextButton.onmouseup =
      this.handlers.onMouseUpSeek;
    this.repeatButton.onclick = this.handlers.onClickRepeat;
    this.shuffleButton.onclick = this.handlers.onClickShuffle;
    this.muteButton.onclick = this.handlers.onClickMute;

    let inputEvent = new InputEvent("input");
    this.playBar.addEventListener("input", this.handlers.onInputPlayBar);
    this.playBar.addEventListener("change", this.handlers.onChangePlayBar);
    this.playBar.dispatchEvent(inputEvent);
  }

  setupPlayer(obj, context) {
    if (obj) {
      // 마지막 세션 세팅
      this.updates.updateProperties(obj, context);
      this._setupOptions.file =
        "https://media.dema.mil.kr/mediavod/_definst_/smil:dematv/" +
        this.currentInfo.url +
        "/playlist.m3u8";

      let options = this._setupOptions;
      let updateMediaSession = this.updates.updateMediaSession;
      let startTime = this.currentInfo.startTime;

      jwplayer("video").setup(options);
      jwplayer().once("beforePlay", () => {
        jwplayer().seek(startTime);
        updateMediaSession();
      });

      this.helpers.letPlayBarIncrease();
      this.updates.updateControlBar();
      this.updates.updatePlayerHandler();
      this.updateTooltip(true, true, true);
    } else {
      // 초기화
      this._setupOptions.file =
        "https://media.dema.mil.kr/mediavod/_definst_/smil:dematv/202205/9617396921029532/9617396921029532.smil/playlist.m3u8";
      let options = this._setupOptions;
      jwplayer("video").setup(options);
      jwplayer().once("ready", () => jwplayer().stop());

      // 컨트롤바 비활성화
      this.helpers.toggleDisabledStatus("control", true);
      this.helpers.toggleDisabledStatus("bars", true);
      this.helpers.toggleDisabledStatus("info", true);

      // 창 정보 비우기
      this.playBar.setAttribute("min", 0);
      this.playBar.setAttribute("max", 0);
      this.playBar.value = 0;
      this.currentTime.innerHTML = "00:00";
      this.remainingTime.innerHTML = "- 00:00";
      this.songTitleSection.innerHTML = "";
      this.songArtistSection.innerHTML = "";

      // 핸들러 달기
      this.helpers.letPlayBarIncrease();
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
    let musicToPlay = queueManager.queueFirstChild;

    this.updateMusicToPlay(musicToPlay);
    this.updateTooltip(true, true, true);
    queueManager.setPlaylistName();
  }

  updateMusicToPlay(musicToPlay) {
    this.currentInfo.reference.isPlaying = false;
    document.querySelectorAll(".playing").forEach((item) => {
      item.classList.remove("playing");
    });
    document.querySelectorAll(".current").forEach((item) => {
      item.classList.remove("current");
    });

    this.helpers.loadMusic(musicToPlay.musicObj, musicToPlay.context);
    let musicID = this.currentInfo.id;
    musicToPlay.classList.add("current");
    document.querySelectorAll(`[music-id=${musicID}]`).forEach((item) => {
      item.classList.add("playing");
    });

    this.currentMusic = musicToPlay;
    queueManager.makeUpLibraryItem();
    this.updates.updatePrevAndNext(musicToPlay);
  }

  updateTooltip(prevOrNext = false, playlist = false) {
    if (prevOrNext) {
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
    } else {
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
    } else {
    }
  }

  updateByQueueChange() {
    let newCurrMusic = queueManager.currentMusic;
    this.currentMusic = newCurrMusic;
    this.updates.updatePrevAndNext(newCurrMusic);
    this.updateTooltip(true, true);
  }

  updates = {
    updateControlBar: () => {
      let isLiked = this.currentInfo.isLiked ? "liked" : "";
      let isContextValid = this.currentInfo.context.startsWith("playlist:")
        ? true
        : false;

      this.playBar.setAttribute("max", parseInt(this.currentInfo.duration));
      this.playBar.value = 0;
      [this.currentTime.innerHTML, this.remainingTime.innerHTML] =
        this.helpers.timeFormatter(0, this.currentInfo.duration);
      this.volumeBar.value = jwplayer().getVolume();

      this.songTitleSection.innerHTML = this.currentInfo.title;
      this.songArtistSection.innerHTML = this.currentInfo.artist;

      this.likeButton.className = isLiked;

      if (!isContextValid) {
        this.helpers.toggleDisabledStatus("playlist", true);
      }
    },

    updatePlayBar: () => {
      let currTime = jwplayer().getPosition() - this.currentInfo.startTime;
      if (this.playBar.value == currTime) return;
      this.playBar.value = currTime;
      [this.currentTime.innerHTML, this.remainingTime.innerHTML] =
        this.helpers.timeFormatter(currTime, this.currentInfo.duration);
    },

    updateVolumeBar: () => {
      let currVolume = jwplayer().getVolume();
      if (this.volumeBar.value == currVolume) return;
      this.volumeBar.value = currVolume;
    },

    updatePrevAndNext: (currentMusic) => {
      this.prevMusic = currentMusic.previousElementSibling
        ? currentMusic.previousElementSibling
        : this.isRepeat
        ? queueManager.queueLastChild
        : undefined;
      this.nextMusic = currentMusic.nextElementSibling
        ? currentMusic.nextElementSibling
        : this.isRepeat
        ? queueManager.queueFirstChild
        : undefined;
    },

    updateMuteState: () => {
      let currMuteState = jwplayer().getMute();
      let userMuteState = this.volumeBar.getAttribute("mute");

      if (userMuteState == currMuteState) return;
      else {
        this.volumeBar.setAttribute("mute", currMuteState);
        this.helpers.toggleVolumeBarMuteState(currMuteState);
      }
    },

    updateMediaSession: () => {
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
    },

    updatePlayerHandler: () => {
      let onTimeHandler = this.handlers.onTime;
      jwplayer().on("time", onTimeHandler);
    },

    updateProperties: (obj, context) => {
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
    },
  };

  handlers = {
    onPlay: (e) => {
      let oldstate = e.oldstate;
      if (oldstate === "buffering") {
        this.helpers.toggleControlStatus();
      }
      this.helpers.letPlayBarIncrease();
    },

    onPause: (e) => {
      let oldstate = e.oldstate;
      if (oldstate === "buffering") {
        this.helpers.toggleControlStatus();
      }
      this.handers.letIncreaseStop();
      this.updates.updatePlayBar();
    },

    onTime: (e) => {
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
    },

    onBuffer: () => {
      this.helpers.toggleControlStatus();
    },

    onComplete: () => {
      let startTime = this.currentInfo.startTime;
      if (this.isRepeat == "one") jwplayer().seek(startTime);
      else this.nextButton.click();
      this.nextButton
        .querySelector(".tooltip")
        .classList.remove("must-visible");
    },

    onPrev: () => {
      let currPostion = this.playBar.value;

      if (currPostion < 10 || !this.prevMusic) {
        jwplayer().seek(this.currentInfo.startTime);
        return;
      }

      let musicToPlay = this.prevMusic;

      this.handlers.isItPlayedEnough();

      this.updateMusicToPlay(musicToPlay);
      this.updateTooltip(true, true);
      queueManager.setPlaylistName();
    },

    onNext: () => {
      let mustStop = false;
      let musicToPlay = this.nextMusic;
      if (!musicToPlay) {
        mustStop = true;
        musicToPlay = queueManager.queueFirstChild;
      }

      this.handlers.isItPlayedEnough();

      this.updateMusicToPlay(musicToPlay);
      this.updateTooltip(true, true);
      queueManager.setPlaylistName();

      if (mustStop) jwplayer().stop();
    },

    onMouseOverTooltip: (e) => {
      let target = e.target;
      target.timerId = setTimeout(() => makeTooltipVisible(), 1000);

      function makeTooltipVisible() {
        let tooltip = target.querySelector(".tooltip");
        tooltip.classList.add("visible");
      }
    },

    onMouseLeaveTooltip: (e) => {
      let target = e.target;
      clearTimeout(target.timerId);
      target.timerId = null;
      target.querySelector(".tooltip").classList.remove("visible");
    },

    onMouseDownSeek: (type = "prev") => {
      let seek, pos;
      const SEEK_TERM = 5;

      if (type == "prev") {
        seek = () => {
          pos -= SEEK_TERM;
          pos = pos < 0 ? 0 : pos;
          jwplayer().seek(pos);
        };
      } else {
        seek = () => {
          pos += SEEK_TERM;
          jwplayer().seek(pos);
        };
      }

      let seeking = (e) => {
        let target = e.target;
        target.querySelector(".tooltip").classList.remove("visible");
        startSeeking = startSeeking.bind(this);
        this.seekStarttimerId = setTimeout(() => {
          target.classList.add("seeking");
          startSeeking();
        }, 2000);

        function startSeeking() {
          jwplayer().pause();
          let origPos = jwplayer().getPosition();
          pos = origPos;
          this.seektimerId = setInterval(seek, 1000);
        }
      };

      return seeking;
    },

    onMouseUpSeek: (e) => {
      let target = e.target;
      target.classList.remove("seeking");
      clearTimeout(this.seekStarttimerId);
      clearInterval(this.seektimerId);
      this.seekStarttimerId = null;
      this.seektimerId = null;
      jwplayer().play();
    },

    onClickRepeat: () => {
      update = update.bind(this);

      if (!this.isRepeat) {
        this.isRepeat = true;
        this.repeatButton.classList.add("active");
        update();
      } else if (this.isRepeat == "one") {
        this.isRepeat = false;
        this.repeatButton.classList.remove("active");
        this.repeatButton.classList.remove("one");
        update();
      } else {
        this.isRepeat = "one";
        this.repeatButton.classList.add("one");
      }

      function update() {
        this.updates.updatePrevAndNext(this.currentMusic);
        this.updateTooltip(true);
      }
    },

    onClickShuffle: () => {
      shuffle = shuffle.bind(this);

      this.isShuffled = !this.isShuffled;
      if (this.isShuffled) {
        shuffle(true);
      } else {
        shuffle(false);
      }

      function shuffle(isShuffled) {
        this.isShuffled = isShuffled;
        if (isShuffled) {
          this.shuffleButton.classList.add("active");
          queueManager.shuffleQueue();
        } else {
          this.shuffleButton.classList.remove("active");
          queueManager.restoreQueue();
        }
        this.updateByQueueChange();
      }
    },

    onClickMute: () => {
      let currMuteState = this.volumeBar.getAttribute("mute");
      currMuteState = !currMuteState;
      this.helpers.toggleVolumeBarMuteState(currMuteState);
    },

    onInputVolumeBar: (e) => {
      let value = e.target.value;
      e.target.style.background =
        "linear-gradient(to right, var(--color-primary, #595ae2) 0%, var(--color-primary, #595ae2) " +
        value +
        "%, var(--color-base-3, #d9d9d9) " +
        value +
        "%, var(--color-base-3, #d9d9d9) 100%)";
    },

    onInputVolumeBarMuted: (e) => {
      let value = e.target.value;
      e.target.style.background =
        "linear-gradient(to right, var(--color-ceil-2, #A9A9A9) 0%, var(--color-ceil-2, #A9A9A9) " +
        value +
        "%, var(--color-base-3, #d9d9d9) " +
        value +
        "%, var(--color-base-3, #d9d9d9) 100%)";
    },

    onChangeVolumeBar: (e) => {
      let volume = e.target.value;
      jwplayer().setVolume(volume);
    },

    onInputPlayBar: (e) => {
      let value = e.target.value;
      value = parseInt((value / this.currentInfo.duration) * 100);
      value = value < 0 ? 0 : value;
      e.target.style.background =
        "linear-gradient(to right, var(--color-primary, #595ae2) 0%, var(--color-primary, #595ae2) " +
        value +
        "%, var(--color-base-3, #d9d9d9) " +
        value +
        "%, var(--color-base-3, #d9d9d9) 100%)";
    },

    onChangePlayBar: (e) => {
      let position = this.currentInfo.startTime + e.target.value;
      jwplayer().seek(position);
    },

    letIncreaseStop: () => {
      if (!this.timerId) return;
      else {
        clearInterval(this.timerId);
        this.timerId = null;
      }
    },

    letPlayBarIncrease: () => {
      if (this.timerId) return;
      else {
        let boundIncrease = increase.bind(this);
        this.timerId = setInterval(boundIncrease, 1000);
      }

      function increase() {
        this.playBar.stepUp();
        [this.currentTime.innerHTML, this.remainingTime.innerHTML] =
          this.helpers.timeFormatter(
            this.playBar.value,
            this.currentInfo.duration
          );
      }
    },
  };

  helpers = {
    loadMusic: (obj, context) => {
      // 음악을 플레이어에 불러오는 메소드
      jwplayer().off("time");
      this.updates.updateProperties(obj, context);

      let startTime = this.currentInfo.startTime;
      let file = {
        file: this.currentInfo.url,
      };
      let updateMediaSession = this.updates.updateMediaSession;

      jwplayer().once("beforePlay", () => {
        jwplayer().seek(startTime);
        updateMediaSession();
      });
      jwplayer().load(file);

      this.updates.updatePlayerHandler();
      this.updates.updateControlBar();
    },

    setPlayerHandlers: () => {
      // 초기에 플레이어 핸들러를 달아주는 메소드
      jwplayer().on("seeked", this.updates.updatePlayBar);
      jwplayer().on("play", this.handlers.onPlay);
      jwplayer().on("pause", this.handlers.onPause);
      jwplayer().on("buffer", this.handlers.onBuffer);
      jwplayer().on("complete", this.handlers.onComplete);
      jwplayer().on("volume", this.updates.updateVolumeBar);
      jwplayer().on("mute", this.updates.updateMuteState);
    },

    isItPlayedEnough: () => {
      // 1분 이상 재생 시 재생 횟수를 더하고 기록 스택에 푸시
      let currTime = this.playBar.value;
      if (currTime > 60) {
        this.currentInfo.reference.playedCounts++;
        queueManager.pushRecordStack(this.currentInfo.reference);
      } else {
      }
    },

    toggleControlStatus: () => {
      // 플레이어의 상태에 따라 컨트롤 패널의 상태 변경
      let isPlaying = jwplayer("video").getState();
      let currState =
        this.playButton.className == "play"
          ? "paused"
          : this.playButton.className == "pause"
          ? "playing"
          : undefined;

      if (isPlaying === "buffering" || isPlaying == "idle") {
        this.helpers.toggleDisabledStatus("control", true);
        return;
      } else if (isPlaying === "playing" && currState != isPlaying) {
        this.playButton.className = "pause";
      } else if (
        (isPlaying === "paused" && currState != isPlaying) ||
        isPlaying === "stopped"
      ) {
        this.playButton.className = "play";
      }

      this.helpers.toggleDisabledStatus("control", false);
    },

    toggleVolumeBarMuteState: (currMuteState) => {
      let inputEvent = new InputEvent("input");
      if (currMuteState) {
        this.volumeBar.removeEventListener("input", this._volumeBarHandler);
        this.volumeBar.addEventListener("input", this._volumeBarHandlerMuted);
        this.volumeBar.dispatchEvent(inputEvent);
        this.volumeBar.disabled = true;
      } else {
        this.volumeBar.removeEventListener(
          "input",
          this._volumeBarHandlerMuted
        );
        this.volumeBar.addEventListener("input", this._volumeBarHandler);
        this.volumeBar.dispatchEvent(inputEvent);
        this.volumeBar.disabled = false;
      }
    },

    toggleDisabledStatus: (node, bool) => {
      switch (node) {
        case "control": {
          this.playButton.disabled = bool;
          this.nextButton.disabled = bool;
          this.prevButton.disabled = bool;
          break;
        }
        case "barsAndOthers": {
          this.playBar.disabled = bool;
          this.volumeBar.disabled = bool;
          this.muteButton.disabled = bool;
          this.openPlaylistButton.disabled = bool;
          this.likeButton.disabled = bool;
          this.meatballsButton.disabled = bool;
        }
        case "playlist": {
          this.openPlaylistButton.disabled = bool;
          break;
        }
      }
      return;
    },

    timeFormatter: (current, duration) => {
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
    },
  };
}
