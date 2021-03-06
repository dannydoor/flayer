/*
  flayer의 하단 컨트롤바의 제어를 담당하는 클래스입니다.

  let controller = new Controller(마지막 세션 정보);
  를 통해 선언해주세요.

  controller.playMusic()
  플레이어블이 클릭되어 큐가 모두 세팅된 후, 큐 매니저가 호출하는 메소드입니다.
  큐의 가장 첫번째 음악부터 재생을 시작합니다.

  controller.updateMusicToPlay(음악 요소)
  전달된 음악 요소를 현재 재생 중인 음악으로 설정하고 불러와 재생합니다.
  재생 대기열의 음악을 클릭 시 큐 매니저가 호출합니다.

  controller.updateTooltip(이전 및 다음 곡, 플레이리스트)
  셔플 또는 반복 재생 모드가 변경되거나 큐의 구성이 바뀌어
  이전 곡과 다음 곡, 또는 현재 재생 중인 음악이 변경되었을 경우
  해당 툴팁의 내용물을 수정합니다.

  controller.updatebyQueueChange()
  셔플 재생 모드가 변경되었을 때 자체적으로 호출하며,
  바로 다음에 재생 또는 나중에 재생 기능이 수행되었을 때
  큐 매니저가 호출합니다.
  큐의 변경사항을 반영합니다.
*/

class Controller {
  constructor(
    initObj = null,
    initContext = null,
    initShuffle = false,
    initRepeat = false,
    initMute = false
  ) {
    // 컨트롤바 요소와 클래스 프로퍼티 대응
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
    this.meatballsButton = window["meatballs-button"];
    this.fullscreenButton = window["fullscreen-button"];
    this.openQueueButton = window["open-queue"];

    // 프로퍼티 초기화
    this.initState = null;
    if (initShuffle) {
      this.shuffleButton.classList.add("active");
    }
    this.isShuffled = initShuffle;
    if (!initRepeat) {
    } else if (initRepeat == "one") {
      this.repeatButton.classList.add("active");
      this.repeatButton.classList.add("one");
    } else {
      this.repeatButton.classList.add("active");
    }
    this.isRepeat = initRepeat;
    this.isMuted = initMute;
    this.timerId = null;
    this.seektimerId = null;
    this.seekStarttimerId = null;
    this._setupOptions = {
      autostart: true,
      width: "100%",
      height: "100%",
      mute: false,
      controls: false,
    };
    this.currentInfo = {
      id: undefined,
      title: undefined,
      artist: undefined,
      context: undefined,
      url: undefined,
      startTime: undefined,
      endTime: undefined,
      duration: undefined,
      isLiked: undefined,
      reference: undefined,
    };
    this._isMediaSessionSet = false;
    this._mediaSessionObj = {
      title: undefined,
      artist: undefined,
      artwork: [
        /*
        {
          src: imgData96,
          sizes: "96x96",
          type: "image/png",
        },
        {
          src: imgData128,
          sizes: "128x128",
          type: "image/png",
        }, */
        {
          src: imgData192,
          sizes: "192x192",
          type: "image/png",
        } /*
        {
          src: imgData256,
          sizes: "256x256",
          type: "image/png",
        },
        {
          src: imgData384,
          sizes: "384x382",
          type: "image/png",
        },
        {
          src: imgData512,
          sizes: "512x512",
          type: "image/png",
        }, */,
      ],
    };

    // 메소드 바인딩
    Controller.playMusic = Controller.playMusic.bind(this);
    Controller.updateMusicToPlay = Controller.updateMusicToPlay.bind(this);
    Controller.updateTooltip = Controller.updateTooltip.bind(this);
    Controller.updateByQueueChange = Controller.updateByQueueChange.bind(this);
    Controller.updatePlayingItems = Controller.updatePlayingItems.bind(this);
    Controller.switchShuffleState = Controller.switchShuffleState.bind(this);
    Controller.stop = Controller.stop.bind(this);
    for (let key in this.updates) {
      this.updates[key] = this.updates[key].bind(this);
    }
    for (let key in this.handlers) {
      this.handlers[key] = this.handlers[key].bind(this);
    }
    for (let key in this.helpers) {
      this.helpers[key] = this.helpers[key].bind(this);
    }

    // 플레이어 셋업
    this.setupPlayer(initObj, initContext);

    // 핸들러 달기
    this.playButton.onclick = this.handlers.onClickPlay;
    this.prevButton.onclick = this.handlers.onPrev;
    this.nextButton.onclick = this.handlers.onNext;
    this.openPlaylistButton.onclick = this.handlers.onClickPlaylist;
    this.meatballsButton.onclick = this.handlers.onClickMeatballs;
    this.songArtistSection.ondblclick = this.handlers.onDblclickArtist;
    this.prevButton.onmouseover =
      this.nextButton.onmouseover =
      this.openPlaylistButton.onmouseover =
      this.openQueueButton.onmouseover =
      this.fullscreenButton.onmouseover =
        this.handlers.onMouseOverTooltip;
    this.prevButton.onmouseleave =
      this.nextButton.onmouseleave =
      this.openPlaylistButton.onmouseleave =
      this.openQueueButton.onmouseleave =
      this.fullscreenButton.onmouseleave =
        this.handlers.onMouseLeaveTooltip;
    this.prevButton.onmousedown = this.handlers.onMouseDownSeek("prev");
    this.nextButton.onmousedown = this.handlers.onMouseDownSeek("next");
    this.prevButton.onmouseup = this.nextButton.onmouseup =
      this.handlers.onMouseUpSeek;
    this.repeatButton.onclick = this.handlers.onClickRepeat;
    this.shuffleButton.onclick = this.handlers.onClickShuffle;
    this.muteButton.onclick = this.handlers.onClickMute;
    this.likeButton.onclick = this.handlers.onClickLike;
    this.fullscreenButton.onclick = () => jwplayer().setFullscreen();
    this.openQueueButton.onclick = this.handlers.onClickOpenQueue.bind(this);
    document.body.addEventListener("mouseup", () => {
      if (document.querySelector(".seeking, .seek-ready")) {
        document
          .querySelector(".seeking, .seek-ready")
          .dispatchEvent(mouseUpEvent);
      }
    });

    // 플레이바 핸들러 달기
    let inputEvent = new InputEvent("input");
    this.playBar.addEventListener("input", this.handlers.onInputPlayBar);
    this.playBar.addEventListener("change", this.handlers.onChangePlayBar);
    this.playBar.dispatchEvent(inputEvent);
  }

  setupPlayer(obj, context) {
    let updateMediaSession = this.updates.updateMediaSession.bind(this);

    if (obj) {
      // 마지막 세션 세팅
      this.updates.updateProperties(obj, context);
      this._setupOptions.file = this.currentInfo.url;

      let options = this._setupOptions;
      let startTime = this.currentInfo.startTime;

      jwplayer("video").setup(options);
      jwplayer().once("beforePlay", () => {
        jwplayer().setMute(this.isMuted);
        jwplayer().seek(startTime);
        jwplayer().stop();
        updateMediaSession();
      });

      this.updates.updateControlBar();
      this.updates.updatePlaylistPlayState();
      this.updates.updatePlayerHandler();
      this.helpers.setPlayerHandlers();

      Controller.updatePlayingItems();
      Controller.updateByQueueChange();
    } else {
      // 초기화
      this._setupOptions.file =
        "https://media.dema.mil.kr/mediavod/_definst_/smil:dematv/202205/9617396921029532/9617396921029532.smil/playlist.m3u8";
      let options = this._setupOptions;
      jwplayer("video").setup(options);
      jwplayer().once("beforePlay", () => {
        jwplayer().setMute(false);
        jwplayer().stop();
        updateMediaSession();
      });

      // 컨트롤바 비활성화
      this.helpers.toggleDisabledState("control", true);
      this.helpers.toggleDisabledState("barsAndOthers", true);
      this.helpers.toggleDisabledState("playlist", true);
      this.initState = "init";

      // 창 정보 비우기
      this.playBar.setAttribute("min", 0);
      this.playBar.setAttribute("max", 0);
      this.playBar.value = 0;
      this.currentTime.innerHTML = "--:--";
      this.remainingTime.innerHTML = "--:--";
      this.songTitleSection.innerHTML = "재생할 음악을";
      this.songArtistSection.innerHTML = "선택해주세요";

      // 핸들러 달기
      this.helpers.setPlayerHandlers();
    }
    this.initState = "init";

    setTimeout(() => {
      jwplayer().once("play", () => {
        if (this.initState) {
          this.helpers.toggleDisabledState("control", false);
          this.helpers.toggleDisabledState("barsAndOthers", false);
          window["element-storehouse"].append(window["video-cover"]);
          this.initState = null;
        }
      });
    }, 300);

    // 볼륨바 핸들러 달기
    if (this.isMuted) {
      this.volumeBar.setAttribute("mute", true);
      this.volumeBar.addEventListener(
        "input",
        this.handlers.onInputVolumeBarMuted
      );
      this.volumeBar.addEventListener(
        "change",
        this.handlers.onChangeVolumeBar
      );
      this.volumeBar.disabled = true;
    } else {
      this.volumeBar.setAttribute("mute", false);
      this.volumeBar.addEventListener("input", this.handlers.onInputVolumeBar);
      this.volumeBar.addEventListener(
        "change",
        this.handlers.onChangeVolumeBar
      );
    }
    this.updates.updateVolumeBar();
  }

  // public 메소드
  static playMusic() {
    // 클릭한 음악을 재생
    // 플레이어블을 클릭했을 때 큐 매니저에 의해 호출
    let musicToPlay = QueueManager.queueFirstChild;

    Controller.updateMusicToPlay(musicToPlay);
  }

  static updateMusicToPlay(musicToPlay) {
    // 컨트롤바의 재생 중인 음악을 전달받은 음악으로 업데이트하고 불러와 재생
    if (this.currentInfo.reference)
      this.currentInfo.reference.isPlaying = false;
    document.querySelectorAll(".playing").forEach((item) => {
      item.classList.remove("playing");
    });
    document.querySelectorAll(".current").forEach((item) => {
      item.classList.remove("current");
    });

    this.helpers.loadMusic(musicToPlay.musicObj, musicToPlay.context);
    let musicId = this.currentInfo.id;
    musicToPlay.classList.add("current");
    document.querySelectorAll(`[music-id="${musicId}"]`).forEach((item) => {
      item.classList.add("playing");
    });

    this.currentMusic = musicToPlay;
    QueueManager.makeUpLibraryItem();
    this.updates.updatePrevAndNext(musicToPlay);
    this.updates.updatePlaylistPlayState();
    queueManager.updateScroll();
  }

  static updateTooltip(prevOrNext = false, playlist = false) {
    // 툴팁 내용 업데이트
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

  static updateByQueueChange() {
    // 컨트롤바의 재생 중인 음악, 이전 곡, 다음 곡을 업데이트하는 메소드
    // 재생 중인 목록에 변화가 생길 때마다 호출
    let newCurrMusic = QueueManager.currentMusic
      ? QueueManager.currentMusic
      : QueueManager.queueFirstChild;
    this.currentMusic = newCurrMusic;
    this.updates.updatePrevAndNext(newCurrMusic);
    Controller.updateTooltip(true);
  }

  static updatePlayingItems() {
    // 라이브러리 정렬이 바뀌면서 playing 클래스가 날아갔을 때 다시 달아주는 메소드
    document
      .querySelectorAll(`[music-id="${this.currentInfo.id}"]`)
      .forEach((item) => {
        item.classList.add("playing");
      });
  }

  static switchShuffleState(bool) {
    // 플레이리스트의 버튼으로 재생할 때 컨트롤러의 셔플 상태를 바꿔주는 메소드
    if (this.isShuffled == bool) return;
    else {
      this.shuffleButton.click();
    }
  }

  static stop() {
    // 재생 중인 플레이리스트가 삭제되었을 때 컨트롤바를 초기화하는 메소드.
    let cover = window["video-cover"],
      storehouse = window["element-storehouse"];

    jwplayer().stop();
    this.helpers.toggleDisabledState("control", true);
    this.helpers.toggleDisabledState("barsAndOthers", true);
    this.helpers.toggleDisabledState("playlist", true);
    this.currentMusic = this.nextMusic = this.prevMusic = undefined;
    this.currentInfo.reference.isPlaying = false;
    this.currentInfo = {
      id: undefined,
      title: undefined,
      artist: undefined,
      context: undefined,
      url: undefined,
      startTime: undefined,
      endTime: undefined,
      duration: undefined,
      isLiked: undefined,
      reference: undefined,
    };

    document
      .querySelectorAll(".playing")
      .forEach((item) => item.classList.remove("playing"));

    this.songTitleSection.innerHTML = "재생할 음악을";
    this.songArtistSection.innerHTML = "선택해주세요";
    this.currentTime.innerHTML = "--:--";
    this.remainingTime.innerHTML = "--:--";

    tab.after(cover);
    setTimeout(
      () =>
        jwplayer().once("play", (e) => {
          console.log(e.oldstate, e.playReason);
          storehouse.append(cover);
          this.helpers.toggleDisabledState("barsAndOthers", false);
        }),
      500
    );
  }

  // private 메소드
  updates = {
    // 컨트롤바의 구성요소들을 업데이트하는 메소드 모음
    updateControlBar: () => {
      // loadMusic이 재생을 시작하기 전에 컨트롤바의 정보 업데이트 및 초기화
      let isLiked = this.currentInfo.isLiked ? "liked" : "";
      let isContextValid = this.currentInfo.context.startsWith("playlist:")
        ? true
        : false;

      this.playBar.setAttribute("max", parseInt(this.currentInfo.duration));
      this.updates.updatePlayBar();
      this.volumeBar.value = jwplayer().getVolume();
      this.volumeBar.dispatchEvent(inputEvent);

      this.songTitleSection.innerHTML = this.currentInfo.title;
      this.songTitleSection.setAttribute("title", this.currentInfo.title);
      this.songArtistSection.innerHTML = this.currentInfo.artist;

      this.likeButton.className = isLiked;

      if (isContextValid) {
        this.helpers.toggleDisabledState("playlist", false);
      } else {
        this.helpers.toggleDisabledState("playlist", true);
      }

      // 그 외 표시 정보 업데이트
    },

    updatePlayBar: () => {
      let currTime = parseInt(
        jwplayer().getPosition() - this.currentInfo.startTime >= 0
          ? jwplayer().getPosition() - this.currentInfo.startTime
          : 0
      );
      this.playBar.value = currTime;
      [this.currentTime.innerHTML, this.remainingTime.innerHTML] =
        this.helpers.timeFormatter(currTime, this.currentInfo.duration);
      this.playBar.dispatchEvent(inputEvent);
    },

    updateVolumeBar: () => {
      let currVolume = jwplayer().getVolume();
      if (this.volumeBar.value == currVolume) {
        this.volumeBar.dispatchEvent(inputEvent);
      } else {
        this.volumeBar.value = currVolume;
        this.volumeBar.dispatchEvent(inputEvent);
      }
    },

    updatePrevAndNext: (currentMusic) => {
      // 주어진 음악을 바탕으로 이전 곡과 다음곡을 업데이트
      this.prevMusic = currentMusic.previousElementSibling
        ? currentMusic.previousElementSibling
        : this.isRepeat
        ? QueueManager.queueLastChild
        : null;
      this.nextMusic = currentMusic.nextElementSibling
        ? currentMusic.nextElementSibling
        : this.isRepeat
        ? QueueManager.queueFirstChild
        : null;
    },

    updateMuteState: () => {
      let currMuteState = jwplayer().getMute();
      let userMuteState = this.isMuted;

      if (userMuteState == currMuteState) return;
      else {
        this.helpers.toggleVolumeBarMuteState(currMuteState);
      }
    },

    updateMediaSession: () => {
      // 미디어세션 API 정보 업데이트
      if (!this._isMediaSessionSet) {
        this._isMediaSessionSet = true;
        this._mediaSessionObj.title = this.currentInfo.title;
        this._mediaSessionObj.artist = this.currentInfo.artist;
        let metadata = this._mediaSessionObj;

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
            window["prev-button"].click()
          );
          navigator.mediaSession.setActionHandler("nexttrack", () =>
            window["next-button"].click()
          );
        }
      } else {
        navigator.mediaSession.metadata.title = this.currentInfo.title;
        navigator.mediaSession.metadata.artist = this.currentInfo.artist;
      }
    },

    updatePlayerHandler: () => {
      // 플레이어의 onTime 핸들러를 갈아끼움
      jwplayer().on("time", this.handlers.onTime);
    },

    updatePlaylistPlayState: () => {
      // 플레이리스트가 재생되고 있을 때 플레이리스트의 재생 정보를 업데이트
      let isValid = this.currentInfo.context.startsWith("playlist:"),
        id = this.currentInfo.context.slice(9),
        now = Date.now(),
        prevElems = document.querySelectorAll(".item-playing");

      if (isValid) {
        playlistManager.table[id].lastPlayed = now;
        let elems = document.querySelectorAll(`[playlist-id="${id}"]`);
        elems[0].setAttribute("last-played", now);
        elems[1].setAttribute("last-played", now);
        elems[0].classList.add("item-playing");
        elems[1].classList.add("item-playing");

        if (prevElems && ![].includes.call(prevElems, elems[0]))
          prevElems.forEach((el) => el.classList.remove("item-playing"));
      } else {
        prevElems.forEach((el) => el.classList.remove("item-playing"));
      }

      playlistManager.updateListSortMode();

      // 그 외 정보 업데이트
      QueueManager.setPlaylistName();
      Controller.updateTooltip(true, true);
    },

    updateProperties: (obj, context) => {
      // currentInfo 객체의 프로퍼티를 업데이트
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
      this.helpers.toggleControlState();
      this.handlers.letPlayBarIncrease();
    },

    onPause: (e) => {
      this.helpers.toggleControlState();
      this.handlers.letIncreaseStop();
      this.updates.updatePlayBar();
    },

    onTime: (e) => {
      let startTime = this.currentInfo.startTime;
      let endTime = this.currentInfo.endTime;
      let currTime = e.position;
      let tooltip = this.nextButton.querySelector(".tooltip");

      if (currTime < startTime) {
        jwplayer().seek(startTime);
      } else if (currTime < endTime - 10) {
        tooltip.classList.remove("must-visible");
      } else if (currTime < endTime) {
        tooltip.classList.add("must-visible");
      } else if (currTime >= endTime) {
        if (this.isRepeat == "one") jwplayer().seek(startTime);
        else this.nextButton.click();
        tooltip.classList.remove("must-visible");
      }
    },

    onBuffer: () => {
      this.helpers.toggleControlState();
      this.handlers.letIncreaseStop();
    },

    onIdle: () => {
      this.helpers.toggleControlState();
      this.handlers.letIncreaseStop();
      this.updates.updatePlayBar();
    },

    onComplete: () => {
      let startTime = this.currentInfo.startTime;
      if (this.isRepeat == "one") jwplayer().seek(startTime);
      else this.nextButton.click();
      this.nextButton
        .querySelector(".tooltip")
        .classList.remove("must-visible");
    },

    onPrev: (e) => {
      if (e.target.isSeeking) {
        e.target.isSeeking = false;
        return;
      }
      e.target.querySelector(".tooltip").classList.remove("must-visible");
      let currPostion = this.playBar.value;

      if (currPostion > 10 || !this.prevMusic) {
        jwplayer().seek(this.currentInfo.startTime);
        return;
      }

      let musicToPlay = this.prevMusic;

      this.helpers.isItPlayedEnough();

      Controller.updateMusicToPlay(musicToPlay);
    },

    onNext: (e) => {
      if (e.target.isSeeking) {
        e.target.isSeeking = false;
        return;
      }
      e.target.querySelector(".tooltip").classList.remove("must-visible");
      let mustStop = false;
      let musicToPlay = this.nextMusic;
      if (!musicToPlay) {
        mustStop = true;
        musicToPlay = QueueManager.queueFirstChild;
      }

      this.helpers.isItPlayedEnough();

      Controller.updateMusicToPlay(musicToPlay);

      if (mustStop) {
        jwplayer().stop();
        this.helpers.toggleControlState();
        this.handlers.letIncreaseStop();
      }
    },

    onMouseOverTooltip: (e) => {
      let target = e.target;
      target.timerId = setTimeout(() => makeTooltipVisible(), 500);

      function makeTooltipVisible() {
        let tooltip = target.querySelector(".tooltip");
        if (tooltip) {
          tooltip.classList.add("visible");
        } else {
          return;
        }
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
        clearTimeout(target.timerId);
        target.classList.add("seek-ready");
        target.querySelector(".tooltip").classList.remove("visible");
        startSeeking = startSeeking.bind(this);
        this.seekStarttimerId = setTimeout(() => {
          target.classList.add("seeking");
          startSeeking();
        }, 1000);

        function startSeeking() {
          target.isSeeking = true;
          jwplayer().pause();
          target.classList.remove("seek-ready");
          let origPos = jwplayer().getPosition();
          pos = origPos;
          this.seektimerId = setInterval(seek, 700);
        }
      };

      return seeking;
    },

    onMouseUpSeek: (e) => {
      let target = e.target;
      target.classList.remove("seek-ready");
      target.classList.remove("seeking");
      clearTimeout(this.seekStarttimerId);
      clearInterval(this.seektimerId);
      this.seekStarttimerId = null;
      this.seektimerId = null;
      jwplayer().play();
    },

    onClickOpenQueue: () => {
      TabManager.toggleQueue();
      queueManager.updateScroll();
    },

    onClickPlay: () => {
      jwplayer().playToggle();
      this.helpers.toggleControlState();
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
        QueueManager.makeUpLibraryItem();
        this.updates.updatePrevAndNext(this.currentMusic);
        Controller.updateTooltip(true);
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
          QueueManager.shuffleQueue();
        } else {
          this.shuffleButton.classList.remove("active");
          QueueManager.restoreQueue();
        }
        Controller.updateByQueueChange();
      }
    },

    onClickMute: () => {
      let currMuteState = this.isMuted;
      currMuteState = !currMuteState;
      jwplayer().setMute(currMuteState);
      this.helpers.toggleVolumeBarMuteState(currMuteState);
    },

    onClickLike: () => {
      let likeState = this.currentInfo.isLiked;
      likeState = !likeState;
      this.currentInfo.reference.isLiked = likeState;
      this.currentInfo.isLiked = likeState;

      Array.prototype.forEach.call(
        document.querySelectorAll(`[music-id="${this.currentInfo.id}"]`),
        (item) => {
          item.setAttribute("is-liked", likeState);
        }
      );

      let isLiked = this.currentInfo.isLiked ? "liked" : "";
      this.likeButton.className = isLiked;
    },

    onClickMeatballs: (e) => {
      e.stopPropagation();

      if (tabManager.editCheck()) return;
      let elem = e.target.closest(".song-info-block");
      ContextmenuManager.addItemContextmenu(elem);
    },

    onDblclickArtist: () => {
      if (!this.currentInfo?.artist) return;
      window["set-artist-tag"].click();
      window["library-search-field"].value = this.currentInfo.artist;
      window["library-search-field"].dispatchEvent(changeEvent);
      if (
        !window["open-library"].classList.contains("active") ||
        window["open-queue"].classList.contains("active")
      ) {
        window["open-library"].click();
      } else if (!!tab.children[2]) {
        window["open-library"].click();
      }
    },

    onClickPlaylist: () => {
      if (tabManager.editCheck()) return;

      let isVisible =
          window["open-playlist"].classList.contains("active") &&
          tab.children.length == 2,
        id = this.currentInfo.context.slice(9);
      if (isVisible) {
        TabManager.showContent(id);
      } else {
        window["open-playlist"].click();
        TabManager.showContent(id);
      }
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
      let volume = parseInt(e.target.value);
      jwplayer().setVolume(volume);
    },

    onInputPlayBar: (e) => {
      let value = e.target.value;
      if (this.currentInfo.duration)
        value = (value / this.currentInfo.duration) * 100;
      value = value < 0 ? 0 : value;
      e.target.style.background =
        "linear-gradient(to right, var(--color-primary, #595ae2) 0%, var(--color-primary, #595ae2) " +
        value +
        "%, var(--color-base-3, #d9d9d9) " +
        value +
        "%, var(--color-base-3, #d9d9d9) 100%)";
    },

    onChangePlayBar: (e) => {
      let value = parseInt(e.target.value);
      [this.currentTime.innerHTML, this.remainingTime.innerHTML] =
        this.helpers.timeFormatter(value, this.currentInfo.duration);
      let position = this.currentInfo.startTime + value;
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
        this.playBar.dispatchEvent(inputEvent);
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
      jwplayer().on("idle", this.handlers.onIdle);
      jwplayer().on("complete", this.handlers.onComplete);
      jwplayer().on("volume", this.updates.updateVolumeBar);
      jwplayer().on("mute", this.updates.updateMuteState);
    },

    isItPlayedEnough: () => {
      // 1분 이상 재생 시 재생 횟수를 더하고 기록 스택에 푸시
      let currTime = this.playBar.value;
      if (currTime > 60) {
        this.currentInfo.reference.playedCounts++;
        QueueManager.pushRecordStack(this.currentInfo.reference);
      } else {
      }
    },

    toggleControlState: () => {
      // 플레이어의 상태에 따라 컨트롤 패널의 상태 변경
      let isPlaying = jwplayer("video").getState();
      let currState =
        this.playButton.className == "play"
          ? "paused"
          : this.playButton.className == "pause"
          ? "playing"
          : undefined;

      if (isPlaying === "buffering") {
        this.helpers.toggleDisabledState("control", true);
        return;
      } else if (isPlaying === "playing" && currState != isPlaying) {
        this.playButton.className = "pause";
      } else if (
        (isPlaying === "paused" && currState != isPlaying) ||
        isPlaying === "idle"
      ) {
        this.playButton.className = "play";
      }

      this.helpers.toggleDisabledState("control", false);
    },

    toggleVolumeBarMuteState: (currMuteState) => {
      // 뮤트 상태에 따라 볼륨바의 인풋 핸들러 교체
      this.isMuted = currMuteState;
      if (currMuteState) {
        this.volumeBar.removeEventListener(
          "input",
          this.handlers.onInputVolumeBar
        );
        this.volumeBar.addEventListener(
          "input",
          this.handlers.onInputVolumeBarMuted
        );
        this.volumeBar.dispatchEvent(inputEvent);
        this.volumeBar.disabled = true;
      } else {
        this.volumeBar.removeEventListener(
          "input",
          this.handlers.onInputVolumeBarMuted
        );
        this.volumeBar.addEventListener(
          "input",
          this.handlers.onInputVolumeBar
        );
        this.volumeBar.dispatchEvent(inputEvent);
        this.volumeBar.disabled = false;
      }
    },

    toggleDisabledState: (node, bool) => {
      // 버튼을 선택적으로 비활성화
      switch (node) {
        case "control": {
          this.repeatButton.disabled = bool;
          this.playButton.disabled = bool;
          this.nextButton.disabled = bool;
          this.prevButton.disabled = bool;
          this.shuffleButton.disabled = bool;
          break;
        }
        case "barsAndOthers": {
          this.playBar.disabled = bool;
          this.volumeBar.disabled = bool;
          this.muteButton.disabled = bool;
          this.likeButton.disabled = bool;
          this.meatballsButton.disabled = bool;
          this.fullscreenButton.disabled = bool;
          break;
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
      let curSec = parseInt(current % 60);
      let remMin = parseInt((duration - current) / 60);
      let remSec = parseInt((duration - current) % 60);

      curSec = formatter(curSec);
      remSec = formatter(remSec);

      let currentTime = curMin + ":" + curSec;
      let remainingTime = "- " + remMin + ":" + remSec;

      return [currentTime, remainingTime];

      function formatter(num) {
        if (num < 10) return "0" + num;
        else return num;
      }
    },
  };
}
