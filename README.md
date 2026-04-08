# LeanCon Home Assignment — BIM Viewer

A web-based BIM viewer built with React and Python/Flask.  
Load IFC models in 3D, and explore a live quantity table broken down by element type and floor level. Clicking any row or column highlights the matching elements in the 3D scene.

<img width="886" height="685" alt="Screenshot 2026-04-08 at 20 06 49" src="https://github.com/user-attachments/assets/7827580b-a449-4d0f-8035-74f1ef0719d1" />

## Features

- 3D IFC model viewer (WebGL, via That Open Company engine)
- Quantity table grouped by element type and building level
- Click a **row** → highlight all elements of that type in the model
- Click a **level column** → highlight all elements on that floor
- Supports multiple IFC files loaded simultaneously
- Friendly element names (uses Revit Family & Type when available)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| 3D Engine | That Open Company (`@thatopen/components`) |
| Backend | Python, Flask |
| IFC Parsing | ifcopenshell |

---

## Project Structure

```
leancon-assignment/
├── backend/
│   ├── main.py           # Flask API — IFC parsing & data extraction
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx                        # Root component, state management
│   │   ├── components/
│   │   │   ├── Viewer/Viewer.jsx          # 3D canvas & highlight control
│   │   │   └── Table/Table.jsx            # Quantity table
│   │   ├── hooks/useBuildingData.js       # Fetches data from backend
│   │   └── utils/BimUtils.js             # BIM engine setup & highlighting
│   └── package.json
└── ifc-files/            # IFC model files
```

---

## Getting Started

### Requirements

- Python 3.9+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Runs on: `http://127.0.0.1:5001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on: `http://localhost:5173`

Open the browser — the app loads automatically.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/files` | List available IFC files |
| GET | `/api/model-data` | Parsed quantity data (levels + rows) |
| GET | `/api/get-ifc?file=<name>` | Serve raw IFC file for 3D rendering |

---

*Built by Stav Cohen | LeanCon Home Assignment | April 2026*
