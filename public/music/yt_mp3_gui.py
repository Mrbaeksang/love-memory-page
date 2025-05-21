import os
import re
import threading
import customtkinter as ctk
from yt_dlp import YoutubeDL
from tkinter import messagebox

# 💾 다운로드 디렉토리 설정 (현재 파일 기준)
DOWNLOAD_DIR = os.path.dirname(__file__)
OUTPUT_FORMAT = os.path.join(DOWNLOAD_DIR, "temp_download.%(ext)s")

# ✍️ 전역 UI 참조
download_log_textbox = None
url_entry_textbox = None

# 🔢 loveN.mp3용 인덱스 계산
def get_next_love_index():
    files = os.listdir(DOWNLOAD_DIR)
    indices = [int(m.group(1)) for f in files if (m := re.match(r"love(\d+)\.mp3", f))]
    return max(indices, default=0) + 1

# 🧾 로그 함수
def log(msg):
    print(msg)
    if download_log_textbox:
        download_log_textbox.configure(state="normal")
        download_log_textbox.insert("end", msg + "\n")
        download_log_textbox.see("end")
        download_log_textbox.configure(state="disabled")

# 🎯 플레이리스트 → 개별 영상 링크 추출
def extract_video_urls(playlist_url):
    log(f"🔍 추출 중: {playlist_url}")
    opts = {
        "quiet": True,
        "extract_flat": "in_playlist",
        "force_generic_extractor": True,
        "dump_single_json": True,
        "skip_download": True,
    }

    try:
        with YoutubeDL(opts) as ydl:
            info = ydl.extract_info(playlist_url, download=False)
            entries = info.get('entries', [])
            urls = [f"https://www.youtube.com/watch?v={e['id']}" for e in entries if 'id' in e]
            log(f"✅ {len(urls)}개 항목 추출 완료")
            return urls
    except Exception as e:
        log(f"❌ 추출 실패: {e}")
        return []

# 🎵 오디오 하나 다운로드 → loveN.mp3로 저장
def download_audio(url, idx, total, love_index):
    log(f"▶️ ({idx}/{total}) 다운로드 중: {url} → love{love_index}.mp3")
    opts = {
        "format": "bestaudio/best",
        "outtmpl": OUTPUT_FORMAT,
        "quiet": True,
        "addmetadata": True,
        "postprocessors": [
            {"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": "192"},
            {"key": "FFmpegMetadata"}
        ],
        "overwrites": True,
    }

    try:
        with YoutubeDL(opts) as ydl:
            ydl.download([url])

        # rename to loveN.mp3
        final_path = os.path.join(DOWNLOAD_DIR, f"love{love_index}.mp3")
        if os.path.exists(final_path):
            os.remove(final_path)  # 혹시라도 중복된 게 있으면 삭제

        # temp file 찾기
        for f in os.listdir(DOWNLOAD_DIR):
            if f.startswith("temp_download") and f.endswith(".mp3"):
                os.rename(os.path.join(DOWNLOAD_DIR, f), final_path)
                log(f"✅ 저장 완료: {final_path}")
                return True

        log("❌ 저장 실패: 파일 찾을 수 없음")
        return False
    except Exception as e:
        log(f"❌ 다운로드 실패: {e}")
        return False

# 🎬 전체 다운로드 프로세스
def run_download():
    raw = url_entry_textbox.get("0.0", "end")
    urls = [line.strip() for line in raw.strip().splitlines() if line.strip()]
    all_urls = []

    for url in urls:
        if "list=" in url:
            all_urls.extend(extract_video_urls(url))
        else:
            all_urls.append(url)

    if not all_urls:
        messagebox.showwarning("링크 없음", "유효한 유튜브 링크가 없습니다.")
        return

    log(f"\n🎶 총 {len(all_urls)}개 항목 다운로드 시작")
    love_index = get_next_love_index()
    failed = []

    for i, url in enumerate(all_urls, 1):
        success = download_audio(url, i, len(all_urls), love_index)
        if success:
            love_index += 1
        else:
            failed.append(url)

    log(f"\n🎉 다운로드 완료: {love_index - 1}개 완료 / {len(failed)}개 실패")

    if failed:
        messagebox.showerror("실패", f"{len(failed)}개 실패:\n" + "\n".join(failed[:5]))
    else:
        messagebox.showinfo("완료", "✅ 모든 항목 다운로드 성공!")

# 🧵 스레드 실행
def start_thread():
    threading.Thread(target=run_download, daemon=True).start()

# 🖼 GUI 구성
def run_gui():
    global download_log_textbox, url_entry_textbox

    ctk.set_appearance_mode("System")
    ctk.set_default_color_theme("blue")

    app = ctk.CTk()
    app.title("YouTube loveN.mp3 다운로더")
    app.geometry("620x700")
    app.resizable(False, False)

    ctk.CTkLabel(app, text="🎵 YouTube → loveN.mp3", font=ctk.CTkFont(size=22, weight="bold")).pack(pady=20)
    ctk.CTkLabel(app, text="👇 동영상 or 플레이리스트 링크 붙여넣기", font=ctk.CTkFont(size=14)).pack()

    url_entry_textbox = ctk.CTkTextbox(app, width=580, height=160, font=ctk.CTkFont(size=13))
    url_entry_textbox.pack(pady=10)
    url_entry_textbox.insert("0.0", "https://www.youtube.com/playlist?list=...")

    ctk.CTkButton(app, text="📥 다운로드 시작", command=start_thread, width=300, height=45).pack(pady=15)

    ctk.CTkLabel(app, text="📄 로그", font=ctk.CTkFont(size=16, weight="bold")).pack()
    download_log_textbox = ctk.CTkTextbox(app, width=580, height=340, font=ctk.CTkFont(size=13))
    download_log_textbox.pack(pady=10)
    download_log_textbox.configure(state="disabled")

    app.mainloop()

if __name__ == "__main__":
    run_gui()
