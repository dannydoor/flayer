// 라이브러리의 정렬과 검색을 관장

class LibraryManager {
  constructor(objHashTable, sortMode = 0) {
    // 0: 제목 - 가수 오름차순 | 1: 제목 - 가수 내림차순 | 2: 가수 - 제목 오름차순 | 3: 가수 - 제목 내림차순
    this.musicObjArr = [];
    for (let key in objHashTable) {
      this.musicObjArr.push(objHashTable[key]);
    }

    this.sortMode = sortMode;

    this.sortedArr = [[], [], [], []];
    [
      this.sortedArr[0],
      this.sortedArr[1],
      this.sortedArr[2],
      this.sortedArr[3],
    ] = ObjectFactory.getSortedArr(objHashTable);
    this.sortedFragment = [];
    this.sortedKeyTable = [{}, {}, {}, {}];
    this.sortedValueTable = [{}, {}, {}, {}];

    for (let i = 0; i < 4; i++) {
      this.sortedFragment.push(new DocumentFragment());
      this.sortedArr[i].forEach((item, index) => {
        this.sortedKeyTable[i][item.id] = index;
        this.sortedValueTable[i][index] = item;

        let elem = document.createElement("div", { is: "library-item" });
        elem.setup(item);
        this.sortedFragment[i].append(elem);
      });
    }
  }

  getPrevObj(id) {
    let index = this.sortedKeyTable[this.sortMode][id];
    return this.sortedValueTable[this.sortMode][index - 1];
  }

  getNextObj(id) {
    let index = this.sortedKeyTable[this.sortMode][id];
    return this.sortedValueTable[this.sortMode][index + 1];
  }

  getFirstObj() {
    return this.sortedValueTable[this.sortMode][0];
  }

  getLastObj() {
    return this.sortedValueTable[this.sortMode][this.sortedArr.length - 1];
  }

  chooseRandObj() {
    return this.musicObjArr[
      Math.floor(Math.random() * this.musicObjArr.length)
    ];
  }
}
