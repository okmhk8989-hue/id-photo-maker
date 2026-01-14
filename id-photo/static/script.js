// ===== 画像補正パラメータ =====
let brightness = 1;
let saturation = 1;
let contrast = 1;

// ===== 状態変数 =====
let img = null;
let backgroundColor = "#ffffff";

let scale = 1;        // 拡大率
let offsetX = 0;     // 左右移動
let offsetY = 0;     // 上下移動
let isDragging = false;
let startX = 0;
let startY = 0;

// ===== サイズ一覧 =====
const sizes = {
  resume: { w: 300, h: 400 },
  passport: { w: 350, h: 450 },
  instagram: { w: 400, h: 400 },
  youtube: { w: 480, h: 270 }
};

// ===== 要素取得 =====
const upload = document.getElementById("upload");
const bgColorInput = document.getElementById("bgColor");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const sizeSelect = document.getElementById("sizeSelect");
const zoomSlider = document.getElementById("zoom");
const brightnessSlider = document.getElementById("brightness");
const saturationSlider = document.getElementById("saturation");
const contrastSlider = document.getElementById("contrast");
const originalImage = document.getElementById("originalImage");

// ===== 背景色変更 =====
bgColorInput.addEventListener("change", () => {
  backgroundColor = bgColorInput.value;
  redraw();
});

// ===== サイズ変更 =====
sizeSelect.addEventListener("change", () => {
  const size = sizes[sizeSelect.value];
  canvas.width = size.w;
  canvas.height = size.h;

  // 位置リセット（重要）
  offsetX = 0;
  offsetY = 0;

  redraw();
});

// ===== ズーム =====
zoomSlider.addEventListener("input", () => {
  scale = Number(zoomSlider.value);
  redraw();
});

// ===== 明るさ =====
brightnessSlider.addEventListener("input", () => {
  brightness = Number(brightnessSlider.value);
  redraw();
});

// ===== 彩度 =====
saturationSlider.addEventListener("input", () => {
  saturation = Number(saturationSlider.value);
  redraw();
});

// ===== コントラスト =====
contrastSlider.addEventListener("input", () => {
  contrast = Number(contrastSlider.value);
  redraw();
});

// ===== 画像アップロード =====
upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 元画像（Before）表示
  originalImage.src = URL.createObjectURL(file);

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("/remove-bg", {
    method: "POST",
    body: formData
  });

  const blob = await res.blob();

  img = new Image();
  img.onload = () => {
    offsetX = 0;
    offsetY = 0;
    scale = 1;
    zoomSlider.value = 1;
    redraw();
  };
  img.src = URL.createObjectURL(blob);
});

// ===== 再描画 =====
function redraw() {
  if (!img) return;

  // 背景
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawImageWithTransform();
}

// ===== 画像を崩さず描画（ドラッグ対応） =====
function drawImageWithTransform() {
  const imgRatio = img.width / img.height;
  const canvasRatio = canvas.width / canvas.height;

  let drawWidth, drawHeight;

  if (imgRatio > canvasRatio) {
    drawWidth = canvas.width * scale;
    drawHeight = drawWidth / imgRatio;
  } else {
    drawHeight = canvas.height * scale;
    drawWidth = drawHeight * imgRatio;
  }

  const x = (canvas.width - drawWidth) / 2 + offsetX;
  const y = (canvas.height - drawHeight) / 2 + offsetY;

  // フィルター適用
  ctx.filter = `
    brightness(${brightness})
    saturate(${saturation})
    contrast(${contrast})
  `;

  ctx.drawImage(img, x, y, drawWidth, drawHeight);

  // リセット（必須）
  ctx.filter = "none";
}

// ===== ドラッグ操作 =====
canvas.addEventListener("mousedown", (e) => {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  offsetX += e.clientX - startX;
  offsetY += e.clientY - startY;

  startX = e.clientX;
  startY = e.clientY;

  redraw();
});

window.addEventListener("mouseup", () => {
  isDragging = false;
});

// ===== ダウンロード =====
document.getElementById("download").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "id_photo.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
