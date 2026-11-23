# generate_audio.py
# 安装依赖：pip install edge-tts
# 运行：python generate_audio.py
# 说明：读取 words.json，批量生成题目语音、单词发音、固定表扬语和可选音效。
# 已存在的文件会自动跳过，缺失也不影响主流程（播放时静默跳过）。

import asyncio
import json
import os

import edge_tts

# 发音人：温柔女声，语速稍慢，适合幼儿
VOICE = "en-US-AnaNeural"
RATE = "-20%"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.join(BASE_DIR, "audio")
WORDS_JSON = os.path.join(BASE_DIR, "words.json")

os.makedirs(AUDIO_DIR, exist_ok=True)


async def generate_audio(text: str, filename: str):
    """生成单个音频文件，已存在则跳过。"""
    path = os.path.join(AUDIO_DIR, filename)
    if os.path.exists(path):
        print(f"跳过已存在：{filename}")
        return
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE)
    await communicate.save(path)
    print(f"生成：{filename}  <-  {text}")


async def main():
    with open(WORDS_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    tasks = []

    # 每个词条：题目语音 + 单词发音
    for theme in data.get("themes", []):
        for item in theme.get("items", []):
            word = item["word"]
            question_text = item.get("questionText") or f"Where is the {word}?"
            q_audio = item.get("questionAudio")
            w_audio = item.get("wordAudio")

            if q_audio:
                tasks.append(generate_audio(question_text, os.path.basename(q_audio)))
            if w_audio:
                tasks.append(generate_audio(word, os.path.basename(w_audio)))

    # 固定语音：表扬 / 鼓励 / 休息 / 庆祝
    fixed = [
        ("Great job!", data.get("praise", {}).get("great", "audio/praise_great.mp3")),
        ("Awesome!", data.get("praise", {}).get("awesome", "audio/praise_awesome.mp3")),
        ("Try again.", data.get("tryAgain", "audio/try_again.mp3")),
        ("Time to play with Daddy or Mommy!", data.get("restPrompt", "audio/rest_prompt.mp3")),
        ("Hooray! You did it!", data.get("celebration", "audio/celebration.mp3")),
    ]
    for text, path in fixed:
        tasks.append(generate_audio(text, os.path.basename(path)))

    # 可选音效：用短语音模拟，不存在也不影响主流程
    sfx = {
        "sfx_dig.mp3": "Dig!",
        "sfx_dump.mp3": "Dump!",
        "sfx_roll.mp3": "Roll!",
        "sfx_mix.mp3": "Mix!",
        "sfx_lift.mp3": "Lift!",
        "sfx_beep.mp3": "Beep!",
        "sfx_car_beep.mp3": "Beep beep!",
        "sfx_bus_horn.mp3": "Honk honk!",
        "sfx_train_choo.mp3": "Choo choo!",
        "sfx_ambulance_weeoo.mp3": "Wee oo wee oo!",
        "sfx_fire_siren.mp3": "Wee oo wee oo!",
        "sfx_police_weeoo.mp3": "Wee oo wee oo!",
        "sfx_airplane_whoosh.mp3": "Whoosh!",
        "sfx_helicopter_whir.mp3": "Whir whir!",
        "sfx_boat_horn.mp3": "Honk!",
    }
    for filename, text in sfx.items():
        tasks.append(generate_audio(text, filename))

    await asyncio.gather(*tasks)
    print("全部音频生成完成。")


if __name__ == "__main__":
    asyncio.run(main())
