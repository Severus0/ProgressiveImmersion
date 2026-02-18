import os
import re

ROOT = "."
OUTPUT = "code.txt"

SKIP_DIRS = {
    ".git",
    "node_modules",
    "dist",
    "build",
    "__pycache__"
}

VALID_EXT = {".js", ".html", ".css"}


def strip_js_css_comments(text):
    # remove /* ... */
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    # remove //...
    text = re.sub(r"//.*", "", text)
    return text


def strip_html_comments(text):
    return re.sub(r"<!--.*?-->", "", text, flags=re.S)


def minify_spaces(text):
    return re.sub(r"\s+", " ", text).strip()


def process_file(path):
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            data = f.read()
    except:
        return None

    ext = os.path.splitext(path)[1]

    if ext in (".js", ".css"):
        data = strip_js_css_comments(data)
    elif ext == ".html":
        data = strip_html_comments(data)

    data = minify_spaces(data)
    return data


def should_skip_dir(dirname):
    return dirname in SKIP_DIRS


def main():
    with open(OUTPUT, "w", encoding="utf-8") as out:
        for root, dirs, files in os.walk(ROOT):
            dirs[:] = [d for d in dirs if not should_skip_dir(d)]

            for file in files:
                ext = os.path.splitext(file)[1]
                if ext not in VALID_EXT:
                    continue

                full_path = os.path.join(root, file)
                content = process_file(full_path)
                if not content:
                    continue

                out.write(f"\n\n===== {full_path} =====\n")
                out.write(content)


if __name__ == "__main__":
    main()

