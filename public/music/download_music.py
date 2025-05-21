import os
import re
import customtkinter as ctk
from tkinter import messagebox
from yt_dlp import YoutubeDL
from threading import Thread

# 🎯 music 폴더 자동 탐색 및 love1.mp3 넘버링 확인
def get_next_index(folder):
    mp3_files = [f for f in os.listdir(folder) if re.match(r"love(\d+)\.mp3", f)]
    indices = [int(re.search(r"love(\d+)\.mp3", f).group(1)) for f in mp3_files]
    return max(indices) + 1 if indices else 1

# 🎼 YouTube로부터 mp3 다운로드 및 정보 추출
def download_mp3s():
    urls = textbox.get("0.0", "end").strip().splitlines()
    if not urls:
        messagebox.showwarning("입력 필요", "URL을 한 줄씩 입력해주세요.")
        return

    download_btn.configure(state="disabled", text="다운로드 중...")
    output_dir = os.path.join(os.getcwd(), "music")
    os.makedirs(output_dir, exist_ok=True)
    start_index = get_next_index(output_dir)

    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'outtmpl': '',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }]
    }

    for i, url in enumerate(urls):
        file_index = start_index + i
        ydl_opts['outtmpl'] = os.path.join(output_dir, f"love{file_index}.%(ext)s")

        try:
            with YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                title = info.get("title", "제목없음")
                uploader = info.get("uploader", "Unknown")
                result_label.configure(text=f"🎶 {title} - {uploader}")
        except Exception as e:
            messagebox.showerror("다운로드 실패", f"{url}\n오류: {str(e)}")
            download_btn.configure(state="normal", text="MP3 다운로드")
            return

    messagebox.showinfo("완료", f"{len(urls)}개 mp3 저장 완료!")
    download_btn.configure(state="normal", text="MP3 다운로드")
    result_label.configure(text="✅ 완료!")

def threaded_download():
    Thread(target=download_mp3s).start()

# 🎨 UI 생성
ctk.set_appearance_mode("light")
ctk.set_default_color_theme("pink")

app = ctk.CTk()
app.title("YouTube → MP3 추출기")
app.geometry("550x500")
app.resizable(False, False)

ctk.CTkLabel(app, text="🎵 유튜브 링크 여러 개 (한 줄에 하나씩)", font=("맑은 고딕", 17)).pack(pady=15)

textbox = ctk.CTkTextbox(app, height=250, width=500, font=("맑은 고딕", 13))
textbox.pack()

download_btn = ctk.CTkButton(app, text="MP3 다운로드", font=("맑은 고딕", 15), command=threaded_download)
download_btn.pack(pady=20)

result_label = ctk.CTkLabel(app, text="", font=("맑은 고딕", 13), text_color="#888")
result_label.pack(pady=5)

app.mainloop()
