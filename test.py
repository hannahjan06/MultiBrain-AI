import whisper

model = whisper.load_model("base", device="cpu")
result = model.transcribe("uploads/sample-0.mp3")
print(result["text"])