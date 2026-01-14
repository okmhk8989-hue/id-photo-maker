from flask import Flask, request, send_file, render_template
from rembg import remove
from PIL import Image
import io
import os

app = Flask(__name__)

# ===== セキュリティ設定 =====
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}
MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/remove-bg", methods=["POST"])
def remove_bg():
    if "image" not in request.files:
        return "画像がありません", 400

    file = request.files["image"]

    if file.filename == "":
        return "ファイル名が不正です", 400

    if not allowed_file(file.filename):
        return "対応していないファイル形式です", 400

    try:
        input_image = Image.open(file.stream).convert("RGBA")
        output_image = remove(input_image)

        buf = io.BytesIO()
        output_image.save(buf, format="PNG")
        buf.seek(0)

        return send_file(buf, mimetype="image/png")

    except Exception:
        return "画像処理中にエラーが発生しました", 500


# ★ Render用の起動設定（必ず最後）
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
