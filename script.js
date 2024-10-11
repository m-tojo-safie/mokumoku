// 全体変数
let polygons = [];
let tmpPositions = [];
let currentStrokeStyle = "#FF0000";
let currentFillStyle = "#00FF00";
let currentLineWidth = 1;
let editTarget = null;
let editPointIdx = null;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const calculatePositionFromEvent = (e) => {
  const canvasX = e.clientX - canvas.getBoundingClientRect().left;
  const canvasY = e.clientY - canvas.getBoundingClientRect().top;
  if (
    canvasX < 0 ||
    canvasX > canvas.width ||
    canvasY < 0 ||
    canvasY > canvas.height
  ) {
    return null;
  }
  return { x: canvasX, y: canvasY };
};

class Polygon {
  constructor(points, strokeStyle, fillStyle, lineWidth, id) {
    this.points = points;
    this.strokeStyle = strokeStyle;
    this.fillStyle = fillStyle;
    this.lineWidth = lineWidth;
    this.id = id;
  }

  drawPolygon() {
    // 描画処理
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let point of this.points) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.lineWidth = this.lineWidth;
    ctx.fillStyle = this.fillStyle;
    ctx.fill();
    ctx.strokeStyle = this.strokeStyle;
    ctx.stroke();
  }

  drawPointCircle() {
    for (let point of this.points) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2, false);
      ctx.fillStyle = "#000000";
      ctx.fill();
    }
  }
}

const draw = () => {
  clearCanvas();
  // ポリゴンを描画
  for (let polygon of polygons) {
    polygon.drawPolygon();
    if (editTarget == polygon.id) {
      polygon.drawPointCircle();
    }
  }
  // 途中のラインを描画
  if (tmpPositions.length > 0) {
    ctx.lineWidth = currentLineWidth;
    ctx.beginPath();
    ctx.moveTo(tmpPositions[0].x, tmpPositions[0].y);
    for (let point of tmpPositions) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.strokeStyle = currentStrokeStyle;
    ctx.stroke();
  }
};

const clearAll = () => {
  polygons = [];
  tmpPositions = [];
  clearCanvas();
  document.getElementById("polygon-list").innerHTML = "";
};

const clearCanvas = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

const setStrokeStyle = (color) => {
  console.log(color);
  currentStrokeStyle = color;
};

const setFillStyle = (color) => {
  currentFillStyle = color;
};

const setLineWidth = (width) => {
  currentLineWidth = width;
};

const deletePolygon = (event) => {
  const polygonId = event.target.getAttribute("data-polygon-id");
  // ポリゴン削除
  targetPolygonIdx = polygons.findIndex((polygon) => polygon.id == polygonId);
  polygons.splice(targetPolygonIdx, 1);
  // リスト削除
  document
    .querySelector(`button[data-polygon-id="${polygonId}"]`)
    .parentNode.remove();
  draw();
};

const editPolygon = (event) => {
  const polygonId = event.target.getAttribute("data-polygon-id");
  // 編集モード解除
  if (editTarget === polygonId) {
    editTarget = null;
    draw();
    return;
  }
  // 編集モードに切り替え
  editTarget = polygonId;
  draw();
};

changePolygonStyle = (polygonId, propertyName, value) => {
  const targetPolygon = polygons.find((polygon) => polygon.id == polygonId);
  targetPolygon[propertyName] = value;
  draw();
};

// イベントの登録

document.addEventListener("DOMContentLoaded", () => {
  draw();
  document.getElementById("clear").addEventListener("click", clearAll);
  document.getElementById("color-stroke").addEventListener("change", (e) => {
    setStrokeStyle(e.target.value);
    if (editTarget) {
      changePolygonStyle(editTarget, "strokeStyle", e.target.value);
    }
  });
  document.getElementById("color-fill").addEventListener("change", (e) => {
    setFillStyle(e.target.value);
    if (editTarget) {
      changePolygonStyle(editTarget, "fillStyle", e.target.value);
    }
  });
  document.getElementById("line-width").addEventListener("change", (e) => {
    setLineWidth(e.target.value);
    if (editTarget) {
      changePolygonStyle(editTarget, "lineWidth", e.target.value);
    }
  });
});

document.addEventListener("mousedown", (e) => {
  const position = calculatePositionFromEvent(e);
  if (position === null) {
    return;
  }
  const x = position.x;
  const y = position.y;
  // 編集モード、後続処理はSKIP
  if (editTarget) {
    // 各ポイントの近くをクリックしたかどうか
    const polygon = polygons.find((polygon) => polygon.id == editTarget);
    for (let i = 0; i < polygon.points.length; i++) {
      const point = polygon.points[i];
      if (Math.abs(point.x - x) < 5 && Math.abs(point.y - y) < 5) {
        editPointIdx = i; // インデックスを代入
        return;
      }
    }
    return;
  }
  // 開始点と近くなったらポリゴンを作成
  if (
    tmpPositions.length > 2 &&
    Math.abs(tmpPositions[0].x - x) < 10 &&
    Math.abs(tmpPositions[0].y - y) < 10
  ) {
    const polygonId = (() => {
      try {
        return polygons[polygons.length - 1].id + 1;
      } catch (e) {
        return 1;
      }
    })();
    polygons.push(
      new Polygon(
        tmpPositions,
        currentStrokeStyle,
        currentFillStyle,
        currentLineWidth,
        polygonId
      )
    );
    // リスト生成
    const listItem = document.createElement("li");
    listItem.classList.add("list-group-item");
    listItem.innerHTML = `Polygon ${polygonId}
                <button
                  class="btn btn-primary ms-2"
                  onClick="editPolygon(event)"
                  data-polygon-id="${polygonId}"
                >
                  編集</button
                ><button
                  class="btn btn-danger ms-2"
                  data-polygon-id="${polygonId}"
                  onClick="deletePolygon(event)"
                >
                  削除
                </button>
              </li>`;
    document.getElementById("polygon-list").appendChild(listItem);
    tmpPositions = [];
    draw();
    return;
  }
  // それ以外は点を追加
  tmpPositions.push({ x: x, y: y });
});

document.addEventListener("mousemove", (e) => {
  const position = calculatePositionFromEvent(e);
  if (position === null) {
    return;
  }
  const x = position.x;
  const y = position.y;
  // 編集モードの場合はポイントを移動
  if (editPointIdx !== null && editTarget) {
    const polygon = polygons.find((polygon) => polygon.id == editTarget);
    polygon.points[editPointIdx] = { x: x, y: y };
    draw();
  }
  draw();
  // マウスの位置までのラインを描画
  if (tmpPositions.length > 0) {
    ctx.beginPath();
    ctx.moveTo(
      tmpPositions[tmpPositions.length - 1].x,
      tmpPositions[tmpPositions.length - 1].y
    );
    ctx.lineTo(x, y);
    ctx.lineWidth = currentLineWidth;
    ctx.strokeStyle = currentStrokeStyle;
    ctx.stroke();
  }
});

document.addEventListener("mouseup", (e) => {
  // ポイントの移動を終了
  if (editPointIdx !== null) {
    editPointIdx = null;
    draw();
  }
});
