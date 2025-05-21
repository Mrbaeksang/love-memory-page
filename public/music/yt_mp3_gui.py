import os
import re
import customtkinter as ctk
from yt_dlp import YoutubeDL
from tkinter import messagebox

DOWNLOAD_DIR = os.path.dirname(__file__)  # 현재 파일 위치 기준

def get_next_index():
    """music 폴더 내 loveN.mp3 형식의 다음 인덱스를 구한다."""
    try:
        files = os.listdir(DOWNLOAD_DIR)
        indices = [
            int(m.group(1)) for f in files
            if (m := re.match(r"love(\d+)\.mp3", f))
        ]
        return max(indices, default=0) + 1
    except Exception as e:
        messagebox.showerror("폴더 오류", f"{DOWNLOAD_DIR} 폴더 접근 중 오류:\n{e}")
        return 1

def make_output_template(index):
    """yt-dlp용 출력 템플릿 반환"""
    return os.path.join(DOWNLOAD_DIR, f"love{index}.%(ext)s")

def download_videos(urls_text):
    urls = [url.strip() for url in urls_text.strip().splitlines() if url.strip()]
    if not urls:
        messagebox.showwarning("입력 없음", "하나 이상의 유튜브 링크를 입력해주세요.")
        return

    index = get_next_index()
    errors = []

    for url in urls:
        output = make_output_template(index)
        opts = {
            "format": "bestaudio/best",
            "outtmpl": output,
            "quiet": True,
            "addmetadata": True,  # 🔥 제목 추출하려면 필요
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "192",
                },
                {
                    "key": "FFmpegMetadata"  # 🔥 제목, 설명 등 삽입
                }
            ],
        }

        try:
            with YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=True)
                print(f"✅ {info.get('title', '제목 없음')} 다운로드 완료 → love{index}.mp3")
                index += 1
        except Exception as e:
            errors.append(f"❌ {url} 실패: {e}")

    if errors:
        messagebox.showerror("일부 실패", "\n\n".join(errors))
    else:
        messagebox.showinfo("완료", "🎉 모든 항목이 성공적으로 다운로드되었습니다!")

def run_gui():
    ctk.set_appearance_mode("System")
    ctk.set_default_color_theme("blue")

    app = ctk.CTk()
    app.title("YouTube → loveN.mp3 변환기")
    app.geometry("500x420")
    app.resizable(False, False)

    ctk.CTkLabel(app, text="🎵 YouTube MP3 다운로더", font=ctk.CTkFont(size=20, weight="bold")).pack(pady=15)

    url_entry = ctk.CTkTextbox(app, width=460, height=220, font=ctk.CTkFont(size=14))
    url_entry.pack(pady=10)

    ctk.CTkButton(app, text="📥 다운로드 시작", command=lambda: download_videos(url_entry.get("0.0", "end"))).pack(pady=15)

    app.mainloop()

if __name__ == "__main__":
    run_gui()