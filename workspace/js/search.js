/*
 * 검색, 태그 관리
 */

class SearchElem {
  constructor(type = "library") {
    this.type = type;
    this.container = window[this.type + "-container"];
    this.searchBox = window[this.type + "-search-box"];
    this.searchSample = window[this.type + "-search-sample"];
    this.searchSampleContent = window[this.type + "-search-sample-content"];
    this.searchOpt = window[this.type + "-search-opt"];
    this.searchOpt = window[this.type + "-search-opt"];
    this.manager =
      type == "library" ? libraryManager : playlistManager.selectableManager;
    this.tagCount = 0;
    this.searchFilter = {
      title: true,
      artist: true,
    };

    this.addTag = this.addTag.bind(this);
    this.removeTag = this.removeTag.bind(this);
    this.tagChecker = this.tagChecker.bind(this);
    this.search = this.search.bind(this);
    this.keyDownHandler = this.keyDownHandler.bind(this);
    this.autoComplete = this.autoComplete.bind(this);

    this.builder();
    this.setupSearch();
  }

  builder() {
    let mainInput = document.createElement("input");

    mainInput.setAttribute("type", "text");
    mainInput.setAttribute("placeholder", "검색");
    mainInput.setAttribute("id", this.type + "-search-field");

    mainInput.addEventListener("change", this.search);
    mainInput.addEventListener("focus", (e) => {
      this.searchBox.classList.add("focused");
    });
    mainInput.addEventListener("blur", (e) => {
      this.manager.updateDisplayedCounts();
      this.searchBox.classList.remove("focused");
    });
    mainInput.addEventListener("keyup", this.tagChecker);
    mainInput.addEventListener("keyup", this.autoComplete);
    mainInput.addEventListener("keydown", this.keyDownHandler);

    this.searchBox.append(mainInput);
    this.inputBox = mainInput;

    this.searchBox.querySelector(".clear-search").onclick = () => {
      mainInput.value = "";
      mainInput.dispatchEvent(changeEvent);
      this.searchSample.classList.add("hidden");
      this.manager.updateDisplayedCounts();

      if (this.tagCount) {
        this.removeTag();
      }
    };
  }

  tagChecker(e) {
    let target = e.target,
      input = target.value.trim();

    if (this.tagCount == 0 && input.startsWith("#")) {
      target.tagChecking = true;
    }

    if (e.code == "Space") {
      if (target.tagChecking) {
        let tagValue = target.value.split(" ");
        let tagReg = new RegExp(tagValue[0] + " ");
        target.value = target.value.replace(tagReg, "");
        target.tagChecking = false;
        this.addTag(tagValue[0]);
      }
    }
  }

  addTag(input) {
    let isValid, content;
    input = input?.replace(/#/g, "");
    if (input == "가수" || input == "제목") {
      content = input;
      isValid = true;
    } else {
      content = "?";
      isValid = false;
    }

    let tag = document.createElement("span");
    tag.className = "tag";
    if (!isValid) tag.classList.add("invalid");

    let tagContent = document.createElement("span");
    tagContent.classList.add("tag-content");
    tagContent.innerHTML = content;

    let removeBtn = document.createElement("div");
    removeBtn.classList.add("remove-tag");
    removeBtn.onclick = () => {
      this.inputBox.focus();
      this.removeTag();
    };

    tag.append(tagContent, removeBtn);

    this.searchBox.prepend(tag);
    this.tagCount = 1;
    this.setSearchFilter(content);

    let menuClass =
      content == "제목" ? "title" : content == "가수" ? "artist" : "all";
    this.searchOpt.firstElementChild
      .querySelector(".checked")
      .classList.remove("checked");
    this.searchOpt.querySelector(`.${menuClass}`).classList.add("checked");
  }

  removeTag() {
    this.searchBox.querySelector(".tag")?.remove();
    this.tagCount = 0;
    this.setSearchFilter();
    this.searchOpt.firstElementChild
      .querySelector(".checked")
      .classList?.remove("checked");
    this.searchOpt.querySelector(".all").classList?.add("checked");
  }

  keyDownHandler(e) {
    e.stopPropagation();
    if (e.code == "Backspace" && e.target.value == "") {
      if (e.target.tagChecking) e.target.tagChecking = false;
      else if (this.tagCount) this.removeTag();
      this.inputBox.dispatchEvent(changeEvent);
      this.manager.updateDisplayedCounts();
    }
  }

  setSearchFilter(type) {
    switch (type) {
      case "가수": {
        this.searchFilter.artist = true;
        this.searchFilter.title = false;
        break;
      }
      case "제목": {
        this.searchFilter.artist = false;
        this.searchFilter.title = true;
        break;
      }
      default: {
        this.searchFilter.artist = true;
        this.searchFilter.title = true;
        return;
      }
    }
    this.manager.updateDisplayedCounts();
  }

  search(e) {
    if (e.target.value.startsWith("#")) return;

    this.searchSample.classList.add("hidden");

    let input = strFormatter(e.target.value),
      container = window[this.type + "-container"],
      list = document.querySelectorAll(`.music-item.${this.type}`);

    list.forEach((item) => {
      item.classList.remove("searched");
    });

    if (input == "") {
      container.classList.remove("searching");
      return;
    }

    container.classList.add("searching");
    if (this.searchFilter.artist) {
      list.forEach((item) => {
        let target = strFormatter(item.getAttribute("song-artist"));
        if (target.includes(input)) item.classList.add("searched");
      });
    }
    if (this.searchFilter.title) {
      list.forEach((item) => {
        let target = strFormatter(item.getAttribute("song-title"));
        if (target.includes(input)) item.classList.add("searched");
      });
    }

    this.manager.updateDisplayedCounts();
    this.inputBox.blur();
  }

  autoComplete(e) {
    // keyup 이벤트 마다 실행
    if (e.code == "Enter") return;

    let target = e.target,
      value = target.value.toLowerCase().trim();

    if (target.tagChecking || value == "") {
      this.searchSample.classList.add("hidden");
      return;
    } else {
      this.searchSample.classList.remove("hidden");
    }

    [].forEach.call(this.searchSampleContent.children, (item) => {
      let str = item.innerHTML.toLowerCase();
      if (str.startsWith(value)) item.classList.add("searched");
      else item.classList.remove("searched");
    });
  }

  setupSearch() {
    let searchSet = new Set(),
      searchSpace;

    for (let key in DbManager.db) {
      searchSet.add(DbManager.db[key].artist);
      searchSet.add(DbManager.db[key].title);
    }

    searchSpace = Array.from(searchSet.keys());
    searchSpace.sort((a, b) => a.localeCompare(b));
    searchSpace.forEach((item) => {
      let div = document.createElement("div");

      div.innerHTML = item;

      div.onmousedown = (e) => {
        window[this.type + "-search-field"].value = e.target.innerHTML;
        window[this.type + "-search-sample"].classList.add("hidden");
      };

      window[this.type + "-search-sample-content"].append(div);
    });
    searchSet = null;
  }
}
