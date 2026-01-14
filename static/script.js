console.log("script loaded");

// ===== 補正パラメータ =====
let brightness = 1;
let saturation = 1;
let contrast = 1;

let img = null;
let backgroundColor = "#ffffff";

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;

const sizes = {
  resume: { w: 300, h: 400 },
  passport: { w: 350, h: 450 },
  instagram: { w: 400, h: 400 },
  youtube: { w: 480, h: 270 }
};

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

// ===== 再描画（安全版）=====
function redraw() {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!img) return;

  drawImage();
}

function drawImage() {
  const imgRatio = img.width / img.height;
  const canvasRatio = canvas.width / canvas.height;

  let w, h;
  if (imgRatio > canvasRatio) {
    w = canvas.width * scale;
    h = w / imgRatio;
  } else {
    h = canvas.height * scale;
    w = h * imgRatio;
  }

  const x = (canvas.width - w) / 2 + offsetX;
  const y = (canvas.height - h) / 2 + offsetY;

  ctx.filter = `
    brightness(${brightness})
    saturate(${saturation})
    contrast(${contrast})
  `;

  ctx.drawImage(img, x, y, w, h);
  ctx.filter = "none";
}

// ===== イベント =====
bgColorInput.onchange = () => {
  backgroundColor = bgColorInput.value;
  redraw();
};

sizeSelect.onchange = () => {
  const s = sizes[sizeSelect.value];
  canvas.width = s.w;
  canvas.height = s.h;
  canvas.style.width = s.w + "px";
  canvas.style.height = s.h + "px";
  offsetX = offsetY = 0;
  redraw();
};

zoomSlider.oninput = () => { scale = +zoomSlider.value; redraw(); };
brightnessSlider.oninput = () => { brightness = +brightnessSlider.value; redraw(); };
saturationSlider.oninput = () => { saturation = +saturationSlider.value; redraw(); };
contrastSlider.oninput = () => { contrast = +contrastSlider.value; redraw(); };

upload.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  originalImage.src = URL.createObjectURL(file);

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("/remove-bg", {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    alert("背景削除に失敗しました");
    return;
  }

  const blob = await res.blob();
  img = new Image();
  img.onload = () => redraw();
  img.src = URL.createObjectURL(blob);
};

// ===== ドラッグ =====
canvas.onmousedown = e => {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
};

window.onmousemove = e => {
  if (!isDragging) return;
  offsetX += e.clientX - startX;
  offsetY += e.clientY - startY;
  startX = e.clientX;
  startY = e.clientY;
  redraw();
};

window.onmouseup = () => isDragging = false;

// ===== ダウンロード =====
document.getElementById("download").onclick = () => {
  const a = document.createElement("a");
  a.download = "id_photo.png";
  a.href = canvas.toDataURL();
  a.click();
};
