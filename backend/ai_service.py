import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

def analyze_book_cover(image_data):
    """
    Analyzes a book cover image and extracts details.
    """
    # Construct path to .env file in the same directory as this script
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    # Reload env vars to pick up changes in .env without server restart
    load_dotenv(dotenv_path=env_path, override=True)
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key or api_key.startswith("your_"):
        return {"error": "مفتاح API الخاص بـ Gemini غير مضبوط في ملف .env"}

    genai.configure(api_key=api_key)

    model = genai.GenerativeModel('gemini-2.0-flash')
    
    prompt = """
    Analyze this book cover and extract the following information in JSON format:
    {
        "title": "Book Title",
        "author": "Author Name",
        "isbn": "ISBN if visible, else null",
        "summary": "A short summary of what the book might be about based on the cover/title. The summary MUST be in Arabic language."
    }
    Return ONLY the JSON.
    """
    
    try:
        response = model.generate_content([prompt, {'mime_type': 'image/jpeg', 'data': image_data}])
        text = response.text
        # Clean up json block if present
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
            
        return json.loads(text)
    except Exception as e:
        print(f"Error analyzing image: {e}")
        return {"error": str(e)}
