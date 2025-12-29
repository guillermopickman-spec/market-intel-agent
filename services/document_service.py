import uuid
from typing import Optional, List, cast
from chromadb.api.types import Metadata, Embedding
from embeddings.model import get_embedding_model
from embeddings.chunker import chunk_text
from chroma.collection import get_collection

def ingest_document(title: str, content: str, conversation_id: Optional[int] = None):
    # 1. Get our (now remote) model and Chroma collection
    model = get_embedding_model()
    collection = get_collection()

    # 2. Break text into chunks
    chunks = chunk_text(content)
    if not chunks:
        print("⚠️ No chunks created from content.")
        return 0
        
    try:
        # 3. Get embeddings via API call 
        print(f"🌐 Requesting embeddings for {len(chunks)} chunks via API...")
        response_data = model.embed(chunks)
        
        # VALIDATION: Ensure response is a list (embeddings) and not a dict (error)
        if not isinstance(response_data, list):
            print(f"❌ API Error or Unexpected Response Format: {response_data}")
            return 0

        # Cast the data so Pylance knows it is now a valid list of embeddings
        all_embeddings = cast(List[Embedding], response_data)
        
        # 4. Prepare IDs and Metadata
        ids = [str(uuid.uuid4()) for _ in chunks]
        metadatas = cast(List[Metadata], [
            {
                "title": title,
                "conversation_id": int(conversation_id) if conversation_id is not None else 0
            } for _ in chunks
        ])

        # 5. Add to ChromaDB
        # Pylance is happy now because all_embeddings is explicitly List[Embedding]
        collection.add(
            documents=chunks,
            embeddings=all_embeddings,
            ids=ids,
            metadatas=metadatas
        )
        
        print(f"✅ Successfully ingested {len(chunks)} chunks into RAG.")
        return len(chunks)
        
    except Exception as e:
        print(f"❌ Ingestion Error: {str(e)}")
        return 0