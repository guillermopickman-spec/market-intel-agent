import chromadb
import os

def get_collection():
    # Creamos la carpeta si no existe
    db_path = os.path.join(os.getcwd(), "chroma_db")
    
    # Usamos PersistentClient para que los datos se guarden en disco
    client = chromadb.PersistentClient(path=db_path)
    
    # Nombre único para todo el proyecto
    return client.get_or_create_collection(name="document_store")