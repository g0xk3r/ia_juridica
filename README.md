Servidor local

http://127.0.0.1:8000/docs

----------------------------------------------------------------------------------------------------

Para correrlo en terminal de windows

python -m venv venv

Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

.\venv\Scripts\activate

----------------------------------------------------------------------------------------------------

Para correr en macOS

python3 -m venv venv

source venv/bin/activate

python -m uvicorn main:app --reload