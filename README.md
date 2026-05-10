# API Asistente Jurídico con IA

API REST construida con FastAPI, FAISS y OpenAI para consultas legales sobre documentos PDF.

---

## Requisitos previos

- Python 3.10 o superior
- Una API Key de OpenAI

---

## Instalación y ejecución

### 1. Clonar / descargar el proyecto

### 2. Crear el archivo de variables de entorno

Copia `.env.example` y renómbralo como `.env`, luego pega tu API Key de OpenAI:

```
OPENAI_API_KEY=sk-proj-tu_api_key_aqui
```

### 3. Crear el entorno virtual e instalar dependencias

#### Windows (PowerShell)

```powershell
python -m venv venv
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
.\venv\Scripts\activate
pip install -r requirements.txt
```

#### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Ejecutar el servidor

```bash
python -m uvicorn main:app --reload
```

El servidor corre en: http://127.0.0.1:8000

Documentación interactiva (Swagger): http://127.0.0.1:8000/docs

---

## Endpoints

### `POST /cargar_documentos/`
Carga un archivo PDF y lo vectoriza en la base de conocimiento.

- **Input:** `archivo` (form-data, tipo `file`, PDF)
- **Output:**
```json
{
  "mensaje": "Se procesó el archivo 'nombre.pdf' y se guardó permanentemente."
}
```

### `POST /consultar/`
Realiza una consulta en lenguaje natural sobre los documentos cargados.

- **Input:** `pregunta` (form-data, tipo `string`)
- **Output:**
```json
{
  "pregunta": "¿Cuál es el plazo para apelar?",
  "respuesta_ia": "Según el documento...",
  "fuentes_consultadas": ["documento_legal.pdf"]
}
```

---

## Solución de problemas comunes en Windows

| Error | Causa | Solución |
|---|---|---|
| `faiss` no instala | Nombre incorrecto del paquete | Usar `faiss-cpu` (ya está en requirements.txt) |
| `No module named multipart` | Falta dependencia de FastAPI | `pip install python-multipart` |
| `AuthenticationError` de OpenAI | Falta el archivo `.env` | Verificar que `.env` existe y la key es válida |
| PowerShell bloquea el venv | Política de ejecución restrictiva | Ejecutar `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| `Could not find a version` en faiss | Python 3.12+ incompatible | Usar Python 3.10 o 3.11 |
