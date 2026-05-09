import os
from typing import List
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# LangChain imports
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

# Configurar la llave de OpenAI (Asegúrate de poner la tuya aquí o en el .env)
os.environ["OPENAI_API_KEY"] = "sk-TU-LLAVE-AQUI"

app = FastAPI(title="API de Asistente Jurídico (RAG)")

# Configurar CORS para que el Front-end de Alan pueda conectarse sin errores
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variable global para guardar nuestra base de datos vectorial en memoria
vector_store = None

@app.post("/cargar_documentos/")
async def cargar_documentos(archivos: List[UploadFile] = File(...)):
    """
    Endpoint para subir uno o varios PDFs, procesarlos y crear la base vectorial.
    """
    global vector_store
    textos_completos = []

    # 1. Leer y procesar cada archivo subido
    for archivo in archivos:
        # Guardar el PDF temporalmente
        file_path = f"temp_{archivo.filename}"
        with open(file_path, "wb") as f:
            f.write(await archivo.read())
        
        # Extraer el texto del PDF
        loader = PyPDFLoader(file_path)
        docs = loader.load()
        
        # Añadir el nombre del archivo a los metadatos para saber la fuente
        for doc in docs:
            doc.metadata["fuente"] = archivo.filename
            
        textos_completos.extend(docs)
        os.remove(file_path) # Borrar el archivo temporal

    # 2. Dividir los textos en pedazos pequeños (Chunks)
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_documents(textos_completos)

    # 3. Crear los Embeddings y guardarlos en FAISS (La base vectorial)
    embeddings = OpenAIEmbeddings()
    vector_store = FAISS.from_documents(chunks, embeddings)

    return {"mensaje": f"Se procesaron {len(archivos)} archivos correctamente y la base vectorial está lista."}


@app.post("/consultar/")
async def consultar(pregunta: str = Form(...)):
    """
    Endpoint donde se hace la pregunta. Busca en la base vectorial y genera la respuesta.
    """
    global vector_store
    if vector_store is None:
        return {"error": "Primero debes cargar documentos usando /cargar_documentos/"}

    # 1. Configurar el LLM (ChatGPT)
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)

    # 2. Crear el Prompt (Las instrucciones estrictas para la IA)
    system_prompt = (
        "Eres un asistente legal experto. Usa los siguientes fragmentos de contexto "
        "recuperado para responder a la pregunta. Si no sabes la respuesta, di que "
        "no lo sabes, no inventes información.\n\n"
        "{context}"
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])

    # 3. Conectar FAISS con el LLM
    retriever = vector_store.as_retriever(search_kwargs={"k": 3}) # Traer los 3 mejores fragmentos
    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)

    # 4. Ejecutar la consulta
    respuesta = rag_chain.invoke({"input": pregunta})

    # 5. Extraer las fuentes de donde sacó la información
    fuentes_usadas = []
    for doc in respuesta["context"]:
        fuente = doc.metadata.get("fuente", "Desconocida")
        if fuente not in fuentes_usadas:
            fuentes_usadas.append(fuente)

    return {
        "pregunta": pregunta,
        "respuesta_ia": respuesta["answer"],
        "fuentes_consultadas": fuentes_usadas
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)