Stamping Frontend: 
cd frontend/stamping/web
npm run dev
Runs on: localhost:5001

Verify Frontend:
cd frontend/verify/web
npm run dev
Runs on: localhost:5000

Backends:
Blockchain: 
cd blockchain/javascript
npm install 
npm run dev
Runs on: localhost:3001

Auth and PDF:
cd backend
python3 -m venv venv
source venv/bin/activate
pipenv install -r requirements.txt 
python -m uvicorn main:app --reload
