# embeddings/chunker.py completo
def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200):
    """
    Divide el texto en trozos más grandes para que la IA no pierda el hilo.
    El overlap de 200 asegura que el final de un trozo aparezca al inicio del siguiente.
    """
    chunks = []
    start = 0

    if not text:
        return []

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        # El siguiente trozo empieza un poco antes de donde terminó este
        start = end - overlap

    return chunks