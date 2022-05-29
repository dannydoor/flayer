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
    obj.title = arr[0];
    obj.artist = arr[1];
    obj.startTime = arr[2];
    obj.endTime = arr[3];
    obj.duration = parseInt(obj.endTime - obj.startTime);
    obj.src = arr[4];
    obj.isLiked = false;
    obj.isPlaying = false;
    obj.isNew = obj.title.includes("[New]");
    obj.id = hash(obj.title + obj.src);
    obj.playedCounts = 0;

    return obj;
  }
}

class ModalManager {
  constructor() {}

  createModal() {
    return "clear";
  }
}

class PlaylistManager {
  constructor() {}

  getPlaylistContents() {
    return [];
  }

  getPlaylistName() {
    return null;
  }
}
