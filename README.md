Para correrlo en terminal de windows

python -m venv venv

Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

.\venv\Scripts\activate

pip install fastapi uvicorn python-multipart langchain langchain-openai faiss-cpu pypdf tiktoken

----------------------------------------------------------------------------------------------------

Para correr en macOS

python3 -m venv venv

source venv/bin/activate

python -m uvicorn main:app --reload