import os
import time
import json
from typing import List
import numpy as np
import faiss
from PyPDF2 import PdfReader
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import uvicorn
from dotenv import load_dotenv

# Cargar las variables secretas de tu archivo .env
load_dotenv()
client = OpenAI()

app = FastAPI(title="API Asistente Jurídico (Nativo y Permanente)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Nombres de los archivos donde guardaremos la base de datos en tu computadora
INDEX_FILE = "base_legal.faiss"
DOCS_FILE = "documentos.json"

# Cargar la base de datos automáticamente si ya existe en el disco duro
if os.path.exists(INDEX_FILE) and os.path.exists(DOCS_FILE):
    faiss_index = faiss.read_index(INDEX_FILE)
    with open(DOCS_FILE, "r", encoding="utf-8") as f:
        documentos_almacenados = json.load(f)
    print("--- ¡Bases de datos cargadas exitosamente desde el disco! ---")
else:
    faiss_index = None
    documentos_almacenados = []

def obtener_embedding(texto: str):
    """Llama a la API de OpenAI para convertir texto en números"""
    respuesta = client.embeddings.create(
        input=[texto], 
        model="text-embedding-3-small" # Modelo optimizado y baratísimo
    )
    return respuesta.data[0].embedding

@app.post("/cargar_documentos/")
async def cargar_documentos(archivo: UploadFile = File(...)):
    global faiss_index, documentos_almacenados
    
    todos_los_chunks = []
    embeddings_lista = []

    # Guardar el PDF temporalmente
    temp_path = f"temp_{archivo.filename}"
    with open(temp_path, "wb") as f:
        f.write(await archivo.read())
    
    # Leer el PDF manualmente con PyPDF2
    reader = PdfReader(temp_path)
    texto_completo = ""
    for page in reader.pages:
        texto_extraido = page.extract_text()
        if texto_extraido:
            texto_completo += texto_extraido + " "
    
    os.remove(temp_path)

    # Dividir el texto en "Chunks" de ~1000 caracteres
    chunk_size = 1000
    for i in range(0, len(texto_completo), chunk_size):
        pedazo = texto_completo[i:i+chunk_size]
        if len(pedazo) > 50:
            todos_los_chunks.append({
                "texto": pedazo, 
                "fuente": archivo.filename
            })
            
    print(f"\n--- Iniciando procesamiento de {len(todos_los_chunks)} fragmentos ---")

    # PROCESAMIENTO EN LOTES PARA NO SATURAR LA API
    tamano_lote = 20
    for i in range(0, len(todos_los_chunks), tamano_lote):
        lote = todos_los_chunks[i:i + tamano_lote]
        textos_lote = [chunk["texto"] for chunk in lote]
        
        try:
            # Mandamos de 20 en 20 de un solo golpe
            respuesta = client.embeddings.create(
                input=textos_lote,
                model="text-embedding-3-small"
            )
            
            # Guardamos los resultados y aplicamos el "modo apantallar"
            for j, data in enumerate(respuesta.data):
                emb = data.embedding
                chunk_actual = lote[j]
                
                embeddings_lista.append(emb)
                documentos_almacenados.append(chunk_actual)
                
                # Impresión en terminal para demostrar la vectorización
                print(f"\n--- Texto extraído: {chunk_actual['texto'][:50]}... ---")
                print(f"--- Vector matemático: {emb[:5]}... (y 1531 dimensiones más) ---")
                
            print(f"\n>>> Procesados {min(i + tamano_lote, len(todos_los_chunks))} de {len(todos_los_chunks)}...")
            
            # Descanso de 2 segundos para no saturar OpenAI
            time.sleep(2)
            
        except Exception as e:
            print(f"\n¡Error de OpenAI en el lote! Detalle: {e}")
            return {"error": f"Error al procesar: {str(e)}"}

    # Construir la base de datos vectorial de FAISS
    dimension = len(embeddings_lista[0])
    if faiss_index is None:
        faiss_index = faiss.IndexFlatL2(dimension)
    
    matriz_vectores = np.array(embeddings_lista).astype('float32')
    faiss_index.add(matriz_vectores)

    # GUARDAR PERMANENTEMENTE EN EL DISCO DURO
    faiss.write_index(faiss_index, INDEX_FILE)
    with open(DOCS_FILE, "w", encoding="utf-8") as f:
        json.dump(documentos_almacenados, f, ensure_ascii=False, indent=4)

    print("\n--- ¡BASE VECTORIAL CREADA Y GUARDADA EN DISCO CON ÉXITO! ---")
    return {"mensaje": f"Se procesó el archivo '{archivo.filename}' y se guardó permanentemente."}


@app.post("/consultar/")
async def consultar(pregunta: str = Form(...)):
    global faiss_index, documentos_almacenados
    
    if faiss_index is None:
        return {"error": "Primero debes cargar documentos usando /cargar_documentos/"}

    # 1. Convertir la pregunta a vector
    vector_pregunta = obtener_embedding(pregunta)
    vector_np = np.array([vector_pregunta]).astype('float32')

    # 2. Buscar en FAISS los 3 fragmentos más parecidos a la pregunta
    k = 3
    distancias, indices = faiss_index.search(vector_np, k)

    contexto_texto = ""
    fuentes_usadas = []

    # 3. Armar el contexto con lo que encontró FAISS
    for idx in indices[0]:
        if idx != -1 and idx < len(documentos_almacenados):
            doc = documentos_almacenados[idx]
            contexto_texto += f"[{doc['fuente']}]: {doc['texto']}\n\n"
            if doc['fuente'] not in fuentes_usadas:
                fuentes_usadas.append(doc['fuente'])

    # 4. Mandar todo a ChatGPT con REGLAS ESTRICTAS ANTI-ALUCINACIÓN
    prompt_final = f"""Eres un asistente legal experto. 
    Tu regla de ORO es responder ÚNICAMENTE basándote en el contexto legal proporcionado abajo.
    Si la respuesta a la pregunta NO se encuentra en el contexto, debes decir EXACTAMENTE: "No tengo suficiente información en los documentos proporcionados para responder a esta pregunta."
    Bajo NINGUNA circunstancia debes inventar información, suponer o usar conocimiento externo.
    Al final de tu respuesta, menciona obligatoriamente el nombre del documento del cual extrajiste la información.
    
    CONTEXTO RECUPERADO:
    {contexto_texto}
    
    PREGUNTA DEL USUARIO: {pregunta}"""

    respuesta = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt_final}],
        temperature=0.0 # Temperatura en 0 para evitar que se ponga "creativo"
    )

    return {
        "pregunta": pregunta,
        "respuesta_ia": respuesta.choices[0].message.content,
        "fuentes_consultadas": fuentes_usadas
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)