Para correrlo en terminal de windows

python -m venv venv

Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

.\venv\Scripts\activate

pip install fastapi uvicorn python-multipart langchain langchain-openai faiss-cpu pypdf tiktoken