document.querySelectorAll("input[type=range]").forEach((item) => {
  item.oninput = function (e) {
    let value = e.target.value;
    e.target.style.background =
      "linear-gradient(to right, var(--color-primary, #595ae2) 0%, var(--color-primary, #595ae2) " +
      this.value +
      "%, var(--color-base-3, #d9d9d9) " +
      this.value +
      "%, var(--color-base-3, #d9d9d9) 100%)";
  };
});

let testObjArray = [
  {
    id: "musicID",
    title: "DM",
    artist: "fromis_9",
    src: "",
    startTime: 0,
    endTime: 206,
    duration: 206,
    isLiked: true,
    isPlaying: true,
    isNew: false,
    playedTime: 1,
  },
  {
    id: "musicID2",
    title: "Feel Good (SECRET CODE)",
    artist: "fromis_9",
    src: "",
    startTime: 0,
    endTime: 223,
    duration: 223,
    isLiked: true,
    isPlaying: false,
    isNew: false,
    playedTime: 1,
  },
  {
    id: "musicID3",
    title:
      "우리의 길 (feat. 김관호, 김다영, 김명식, 김상우, 김형미, 김훈희, 민나래, 이찬미, 임성규, 조서연, 조아라, 조찬미 & 한설희)",
    artist: "염평안",
    src: "",
    startTime: 0,
    endTime: 306,
    duration: 306,
    isLiked: true,
    isPlaying: false,
    isNew: false,
    playedTime: 1,
  },
  {
    id: "musicID4",
    title: "너를 따라 너에게",
    artist: "fromis_9",
    src: "",
    startTime: 0,
    endTime: 213,
    duration: 213,
    isLiked: true,
    isPlaying: false,
    isNew: false,
    playedTime: 1,
  },
  {
    id: "musicID5",
    title: "L'Amour, Les Baguettes, Paris",
    artist: "Stella Jang",
    src: "",
    startTime: 0,
    endTime: 167,
    duration: 167,
    isLiked: true,
    isPlaying: false,
    isNew: false,
    playedTime: 1,
  },
];

let itemType = ["library", "playlist", "queue", "editing", "selectable"];

let context = "fromis_9";

for (let i = 0; i < 5; i++) {
  let obj = testObjArray[i];
  let type = itemType[i];

  let item = document.createElement("div", { is: `${type}-item` });
  item.setup(obj, context, i + 1);
  window["test-div"].append(item);
}

function setupSlip(list) {
  list.addEventListener(
    "slip:beforereorder",
    function (e) {
      /* if (!e.target.classList.contains('queue') && !e.target.classList.contains('editing')) {
          e.preventDefault();
      } */
      if (
        e.target.classList.contains("library") ||
        e.target.classList.contains("playlist") ||
        e.target.classList.contains("selectable")
      )
        e.preventDefault();
    },
    false
  );

  list.addEventListener(
    "slip:beforeswipe",
    (e) => {
      e.preventDefault();
    },
    false
  );

  list.addEventListener(
    "slip:beforewait",
    (e) => {
      if (e.target.classList.contains("music-drag")) {
        e.preventDefault();
      }
    },
    false
  );

  list.addEventListener(
    "slip:reorder",
    (e) => {
      e.target.parentNode.insertBefore(e.target, e.detail.insertBefore);
      return false;
    },
    false
  );

  let options = {
    ignoredElements: [".library", ".playlist", ".selectable"],
  };

  return new Slip(list, options);
}

let testDiv = window["test-div"];
setupSlip(testDiv);
