import asyncio
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

# --- IMPORTACIONES DE SERVICIOS ---
from services.document_service import ingest_document
from services.scraper_service import scrape_and_ingest
from services.login_service import automate_login_test
from services.notion_service import create_notion_page_content, send_report_to_notion
from services.email_service import send_custom_email  # <-- Importante para el Día 30

router = APIRouter(prefix="/documents", tags=["documents"])

# --- MODELOS DE DATOS ---

class ScrapeRequest(BaseModel):
    url: str

class NotionRequest(BaseModel):
    text: str

class EmailRequest(BaseModel):  # <-- Nuevo modelo para el Día 30
    email: str
    subject: str
    body: str

# --- ENDPOINTS EXISTENTES ---

@router.post("/subir-archivo")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename or not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos .txt")
    content = await file.read()
    text = content.decode("utf-8")
    count = ingest_document(title=file.filename, content=text)
    return {"filename": file.filename, "chunks_ingested": count}

@router.post("/scrapear-web")
async def scrape_web(data: ScrapeRequest):
    try:
        loop = asyncio.get_running_loop()
        resultado_msg = await loop.run_in_executor(None, scrape_and_ingest, data.url)
        return {"url": data.url, "detail": resultado_msg}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test-login")
async def test_login():
    try:
        loop = asyncio.get_running_loop()
        resultado = await loop.run_in_executor(None, automate_login_test)
        return {"status": "ok", "message": resultado}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/enviar-notion")
async def send_to_notion(data: NotionRequest):
    resultado = create_notion_page_content(data.text)
    return {"status": "ok", "message": resultado}

@router.post("/scrape-to-notion")
async def scrape_to_notion(data: ScrapeRequest):
    try:
        loop = asyncio.get_running_loop()
        text_content = await loop.run_in_executor(None, scrape_and_ingest, data.url)
        success = send_report_to_notion(title=data.url, content=text_content)
        
        if success:
            return {"status": "success", "detail": f"Análisis de {data.url} enviado a Notion."}
        else:
            raise HTTPException(status_code=500, detail="Error al enviar a Notion.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el flujo: {str(e)}")

# --- NUEVO ENDPOINT DÍA 30: ENVÍO DE EMAIL ---

@router.post("/enviar-email")
async def email_endpoint(data: EmailRequest):
    """
    Día 30: Envía un correo electrónico usando SMTP.
    """
    try:
        # Ejecutamos el envío de email
        resultado = send_custom_email(
            to_email=data.email, 
            subject=data.subject, 
            content=data.body
        )
        
        if "✅" in resultado:
            return {"status": "success", "message": resultado}
        else:
            # Si el servicio devuelve un mensaje con "❌", lanzamos error
            raise HTTPException(status_code=500, detail=resultado)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error crítico: {str(e)}")