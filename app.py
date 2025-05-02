# ift3150/app.py

import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List, Dict
import logging
import json, os
from enum import Enum
import google.generativeai as genai
from dotenv import load_dotenv

# --- 1) Chargement dynamique des catégories/skills
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "categories.json")
with open(DATA_PATH, "r", encoding="utf-8") as f:
    CATEGORIES: Dict[str, List[str]] = json.load(f)
# Ex. CATEGORIES = { "Plomberie": ["Installation de douches", "Réparation de fuites", …], … }

# --- Configuration Gemini
load_dotenv(".env.local")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("Clé GEMINI_API_KEY manquante dans .env.local")
genai.configure(api_key=GEMINI_API_KEY)
MODEL_NAME = "gemini-1.5-flash"

# --- 2) System prompt enrichi avec la liste des catégories
SYSTEM_PROMPT = f"""**Rôle** : Assistant expert en réparations domiciliaires.

**Catégories disponibles** : {', '.join(CATEGORIES.keys())}

**Format de réponse JSON STRICT** :
```json
{{
  "type": "salutation|{'|'.join(cat.lower() for cat in CATEGORIES.keys())}|autre",
  "severity": 1-5,
  "professional": "{'|'.join(cat.lower() for cat in CATEGORIES.keys())}|Homme à tout faire",
  "response": "Message clair, concis (max 200 caractères), on veut savoir si juste un homme à tout faire est correct pour le travail ou s'il y a besoin d'un spécialiste."
}}
```"""

class UserMessage(BaseModel):
    text: str
    conversation_history: Optional[List[Dict]] = None

app = FastAPI()

def generate_with_gemini(prompt: str) -> str:
    model = genai.GenerativeModel(MODEL_NAME)
    response = model.generate_content(
        prompt,
        generation_config={"temperature": 0.2, "max_output_tokens": 200}
    )
    return response.text

def analyze_with_gemini(text: str) -> dict:
    prompt = f"""{SYSTEM_PROMPT}

Analysez ce message utilisateur :
'''{text}'''
"""
    try:
        result = generate_with_gemini(prompt)
        start = result.find("{")
        end   = result.rfind("}") + 1
        return eval(result[start:end])
    except Exception as e:
        logging.warning(f"Fallback local déclenché : {e}")
        return local_fallback(text)

def local_fallback(text: str) -> dict:
    t = text.lower()
    # 3) Itération sur toutes les catégories/skills
    for category, skills in CATEGORIES.items():
        for skill in skills:
            if skill.lower() in t:
                return {
                    "type":        category.lower(),
                    "severity":    2,
                    "professional": category.lower(),
                    "response":    f"Pour « {text} », un {category.lower()} est requis."
                }
    # salutations
    if any(kw in t for kw in ["salut", "bonjour"]):
        return {
            "type": "salutation",
            "severity": 1,
            "professional": "none",
            "response": "Bonjour! Décrivez votre problème."
        }
    # défaut
    return {
        "type": "autre",
        "severity": 1,
        "professional": "Homme à tout faire",
        "response": "Pouvez-vous préciser votre demande ?"
    }

@app.post("/analyze")
async def analyze_request(msg: UserMessage):
    try:
        if any(kw in msg.text.lower() for kw in ["salut", "bonjour"]):
            return {
                "type": "salutation",
                "severity": 1,
                "professional": "none",
                "response": "Bonjour! Comment puis-je vous aider?"
            }
        return analyze_with_gemini(msg.text)
    except Exception as e:
        logging.error(f"Erreur critique : {e}")
        return {
            "type": "erreur",
            "severity": 1,
            "professional": "Homme à tout faire",
            "response": "Service temporairement indisponible"
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
