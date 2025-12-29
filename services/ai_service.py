from typing import Optional, List, Tuple, cast
from chromadb.api.types import Embedding
from chroma.collection import get_collection
from embeddings.model import get_embedding_model
from services.llm.huggingface import HuggingFaceClient 

def ask_document_question(question: str, conversation_id: Optional[int] = None) -> Tuple[str, List[str]]:
    model = get_embedding_model()
    collection = get_collection()
    
    # Generate the embedding and cast it to the correct format for ChromaDB
    raw_embeddings = list(model.embed([question]))
    query_vector = cast(List[Embedding], [[float(val) for val in raw_embeddings[0]]])

    search_params = {"query_embeddings": query_vector, "n_results": 7}
    
    if conversation_id:
        search_params["where"] = {"conversation_id": int(conversation_id)}
    
    results = collection.query(**search_params)
    
    documents_list = results.get('documents') or []
    metadatas_list = results.get('metadatas') or []
    
    context = ""
    sources = []

    if documents_list and len(documents_list) > 0 and metadatas_list and len(metadatas_list) > 0:
        first_docs = documents_list[0]
        first_metas = metadatas_list[0]
        
        if first_docs:
            context = "\n---\n".join(first_docs)
        if first_metas:
            sources = list(set([str(m.get('title', 'Unknown Source')) for m in first_metas if m]))
    else:
        context = "No relevant information found."
        sources = []

    prompt = (
        f"You are a technical expert. Based ONLY on the provided context, "
        f"answer the question.\n\nCONTEXT:\n{context}\n\nQUESTION: {question}\n\nANSWER:"
    )
    
    try:
        hf_client = HuggingFaceClient()
        respuesta_ia = hf_client.generate(prompt)
        return respuesta_ia, sources
    except Exception as e:
        return f"IA Connection Error: {str(e)}", []