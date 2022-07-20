/* class ObjectFactory {
  constructor() {
    ObjectFactory.objHashTableBuilder =
      ObjectFactory.objHashTableBuilder.bind(this);
    ObjectFactory.getSortedArr = ObjectFactory.getSortedArr.bind(this);
    this.reg = /\[New\]\s/g;
  }

  static objHashTableBuilder(arr, obj) {
    if (!obj) obj = {};
    let needsUpdate = !Object.keys(obj).length;

    if (needsUpdate) {
      arr.forEach((item) => {
        let title = this.reg.test(item[0])
          ? item[0].replace(this.reg, "")
          : item[0];
        let key = hash(title + item[4]);

        if (obj[key] !== undefined) {
          obj[key].startTime = item[2];
          obj[key].endTime = item[3];
          obj[key].duration = parseInt(item[3] - item[2]);
          obj[key].isNew = false;
        } else if (obj[key + "#"]) {
          obj[key] = obj[key + "#"];
          obj[key + "#"] = undefined;

          obj[key].startTime = item[2];
          obj[key].endTime = item[3];
          obj[key].duration = parseInt(item[3] - item[2]);
          obj[key].isNew = true;
        } else {
          let newObj = this._builder(item);
          obj[key] = newObj;
          obj[key].isNew = true;
        }
      });
    }

    for (let key in obj) {
      searchSet.add(obj[key].artist);
      searchSet.add(obj[key].title);
    }

    searchSpace = Array.from(searchSet.keys());
    searchSpace.sort((a, b) => a.localeCompare(b));
    searchSpace.forEach((item) => {
      let libraryDiv = document.createElement("div"),
        selectableDiv = document.createElement("div");

      libraryDiv.innerHTML = selectableDiv.innerHTML = item;

      libraryDiv.onmousedown = (e) => {
        window["library-search-field"].value = e.target.innerHTML;
        window["library-search-sample"].classList.add("hidden");
      };
      selectableDiv.onmousedown = (e) => {
        window["selectable-search-field"].value = e.target.innerHTML;
        window["selectable-search-sample"].classList.add("hidden");
      };

      window["library-search-sample-content"].append(libraryDiv);
      window["selectable-search-sample-content"].append(selectableDiv);
    });
    searchSet = null;

    return obj;
  }

  static getSortedArr(obj) {
    let arr1 = [];
    let arr2, arr4;
    for (let key in obj) {
      if (!key.endsWith("#") && !obj[key].isHided) {
        arr1.push(obj[key]);
      }
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
    let obj = {},
      isNew = this.reg.test(arr[0]);
    obj.title = isNew ? arr[0].replace(this.reg, "") : arr[0];
    obj.artist = arr[1];
    obj.startTime = arr[2];
    obj.endTime = arr[3];
    obj.duration = parseInt(obj.endTime - obj.startTime);
    obj.src = arr[4];
    obj.isLiked = false;
    obj.isPlaying = false;
    obj.isNew = true;
    obj.id = hash(obj.title + obj.src);
    obj.playedCounts = 0;
    obj.isHided = false;

    return obj;
  }
}

*/
