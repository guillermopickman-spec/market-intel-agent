import requests
import os
from dotenv import load_dotenv
import textwrap

load_dotenv()

NOTION_TOKEN = os.getenv("NOTION_TOKEN")
PAGE_ID = os.getenv("NOTION_PAGE_ID")

def create_notion_page_content(text: str):
    """Función simple para enviar un párrafo (la que usábamos antes)"""
    url = f"https://api.notion.com/v1/blocks/{PAGE_ID}/children"
    headers = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }
    data = {
        "children": [{
            "object": "block",
            "type": "paragraph",
            "paragraph": {"rich_text": [{"text": {"content": text}}]}
        }]
    }
    response = requests.patch(url, headers=headers, json=data)
    return "✅ OK" if response.status_code == 200 else f"❌ Error: {response.text}"

def send_report_to_notion(title: str, content: str):
    url = f"https://api.notion.com/v1/blocks/{PAGE_ID}/children"
    headers = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }

    children = [
        {
            "object": "block",
            "type": "heading_2",
            "heading_2": {"rich_text": [{"text": {"content": f"📌 Reporte: {title}"}}]}
        }
    ]

    # Usamos textwrap para cortar el texto sin romper palabras
    # width=2000 asegura que cada bloque sea de máximo 2000 caracteres
    paragraphs = textwrap.wrap(content, width=2000, replace_whitespace=False)

    for p in paragraphs:
        children.append({
            "object": "block",
            "type": "paragraph",
            "paragraph": {"rich_text": [{"text": {"content": p}}]}
        })

    data = {"children": children}
    response = requests.patch(url, headers=headers, json=data)
    return response.status_code == 200