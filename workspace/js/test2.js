class ObjectFactory {
  constructor() {
    ObjectFactory.objHashTableBuilder =
      ObjectFactory.objHashTableBuilder.bind(this);
    ObjectFactory.getSortedArr = ObjectFactory.getSortedArr.bind(this);
  }

  static objHashTableBuilder(arr) {
    let obj = {};
    arr.forEach((item) => {
      let newObj = this._builder(item);
      obj[newObj.id] = newObj;
    });
    return obj;
  }

  static getSortedArr(obj) {
    let arr1 = [];
    let arr2, arr4;
    for (let key in obj) {
      arr1.push(obj[key]);
    }
    let arr3 = arr1.slice();

    arr1.sort(compareTitle);
    arr2 = arr1.slice().reverse();
    arr3.sort(compareArtist);
    arr4 = arr3.slice().reverse();

    return [arr1, arr2, arr3, arr4];

    function compareTitle(obj1, obj2) {
      let title1 = strFormatter(obj1["title"]);
      let title2 = strFormatter(obj2["title"]);
      let artist1 = strFormatter(obj1["artist"]);
      let artist2 = strFormatter(obj2["artist"]);
      return !!title1.localeCompare(title2)
        ? title1.localeCompare(title2)
        : artist1.localeCompare(artist2);
    }

    function compareArtist(obj1, obj2) {
      let title1 = strFormatter(obj1["title"]);
      let title2 = strFormatter(obj2["title"]);
      let artist1 = strFormatter(obj1["artist"]);
      let artist2 = strFormatter(obj2["artist"]);
      return !!artist1.localeCompare(artist2)
        ? artist1.localeCompare(artist2)
        : title1.localeCompare(title2);
    }
  }

  _builder(arr) {
    let obj = {};
    let isNew = false;
    let reg = /\[New\]\s/g;
    isNew = reg.test(arr[0]);
    obj.title = isNew ? arr[0].replace(reg, "") : arr[0];
    obj.artist = arr[1];
    obj.startTime = arr[2];
    obj.endTime = arr[3];
    obj.duration = parseInt(obj.endTime - obj.startTime);
    obj.src = arr[4];
    obj.isLiked = false;
    obj.isPlaying = false;
    obj.isNew = isNew;
    obj.id = hash(obj.title + obj.src);
    obj.playedCounts = 0;

    return obj;
  }
}

class ModalManager {
  constructor() {}

  createModal() {
    let answer = prompt(
      "현재 재생 대기 중인 음악이 있습니다. 그대로 유지하고 재생하겠습니까? (yes: 재생 대기 목록 유지 | clear: 지우고 재생)"
    );
    if (answer == "clear") return "clear";
    else if (answer.startsWith("y")) return "keep";
    else return "cancel";
  }
}

class PlaylistManager {
  constructor() {
    let f9Ids = [
      "b8c7ae2910424c46ee902c2d89b92bae",
      "b4c6da2da37901c304515cb037be5aa3",
      "db95bc4542cd1b09846eb457e0466b65",
      "f3b6994b4c6357599a6c2216b1147553",
      "840309a1673dc890296a3b46488f53d0",
      "dca2c4e9aba2b938c6a90eacd4692ba9",
      "62963235b875a134c90a5bdb1d0e7009",
      "e63b158a5766e783082f6bc698764cfa",
      "b97d9deb688e95123bc5056751e61874",
      "8766b377dd71d237834c7889d2c353c0",
      "bca77e0673e76fb5b97049106a4592da",
      "78fdf3ffbdc79e644b8f915fbadd4da2",
      "5408f44cb7b22af2a1cb6d2107721080",
      "b5f43499021d52b70f5ffa371577eb7f",
      "17ccc83bece16520a59c8889feb4e0ad",
      "315e91611a0a510f6f1c880baab0e55f",
    ];
    this.tempPlaylistFragment = new DocumentFragment();
    this.tempPlaylistArr = f9Ids.map((item) => objTable[item]);
    this.tempModified = [];
    this.tempChanges = { added: [], deleted: [] };
    this.tempContext = hash("프롬이가 채고야" + Date.now());
    this.tempPlaylistArr.forEach((obj, index) => {
      let elem = document.createElement("div", { is: "playlist-item" });
      elem.setup(obj, this.tempContext, index + 1);
      this.tempPlaylistFragment.append(elem);
    });
  }

  _delete(num) {
    if (this.tempChanges.deleted.length == this.tempPlaylistArr.length) return;
    if (!this.tempModified.length)
      this.tempModified = this.tempPlaylistArr.slice();

    let length = this.tempModified.length;
    let randNum,
      delTarget,
      gotcha = false;

    while (!gotcha) {
      randNum = Math.floor(Math.random() * length);
      if (this.tempChanges.added.includes(this.tempModified[randNum])) {
        continue;
      } else {
        gotcha = true;
        delTarget = this.tempModified[randNum];
      }
    }

    this.tempChanges.deleted.push(delTarget);
    this.tempModified.splice(randNum, 1);

    if (num) this._delete(--num);
    else return;
  }

  _add(num) {
    if (!this.tempModified.length)
      this.tempModified = this.tempPlaylistArr.slice();

    let length = this.tempModified.length;
    let randNum = Math.floor(Math.random() * length);
    let gotcha = false,
      addTarget;

    while (!gotcha) {
      let target = libraryManager.chooseRandObj();
      if (this.tempModified.includes(target)) {
        continue;
      } else {
        gotcha = true;
        addTarget = target;
      }
    }

    this.tempChanges.added.push(addTarget);
    this.tempModified.splice(randNum, 0, addTarget);

    if (num) this._add(--num);
    else return;
  }

  _switch(num) {
    if (!this.tempModified.length)
      this.tempModified = this.tempPlaylistArr.slice();

    let length = this.tempModified.length;
    let rand1 = Math.floor(Math.random() * length);
    let rand2 = Math.floor(Math.random() * length);

    [this.tempModified[rand1], this.tempModified[rand2]] = [
      this.tempModified[rand2],
      this.tempModified[rand1],
    ];

    if (num) this._switch(--num);
    else return;
  }

  _init() {
    this.tempModified = [];
    this.tempChanges = { added: [], deleted: [] };
  }

  _confirmChange() {
    if (!this.tempModified.length) return;
    let initTime = Date.now();
    QueueManager.applyPlaylistChanges(
      this.tempModified,
      "playlist:" + this.tempContext,
      this.tempChanges
    );
    // console.log(Date.now - initTime);

    this.tempPlaylistArr = this.tempModified.slice();
    this.tempPlaylistFragment = new DocumentFragment();
    this.tempPlaylistArr.forEach((obj, index) => {
      let elem = document.createElement("div", { is: "playlist-item" });
      elem.setup(obj, this.tempContext, index + 1);
      this.tempPlaylistFragment.append(elem);
    });
    Array.prototype.forEach.call(this.tempPlaylistFragment, (item, index) => {
      item.updateIndex(index + 1);
    });
    this._init();
  }

  getPlaylistContents(context) {
    if (!context) return;
    if (context.startsWith("playlist:")) return this.tempPlaylistArr;
    else return [];
  }

  getPlaylistName(context) {
    if (!context) return;
    if (context.startsWith("playlist:")) return "프롬이가 채고야";
    return null;
  }
}
