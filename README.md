# Nutrix

**Nutrition-Based Meal Optimization** — a modern, intelligent web application designed to analyze nutritional datasets and build optimal meal plans using Operations Research. 

The application evaluates food items, nutritional attributes, and costs to find meal combinations that satisfy strict nutritional requirements (e.g., Calories, Protein, Fiber) while respecting practical constraints.

The interface is built with a clean, minimalist "Linear × Notion" design aesthetic, focusing on a streamlined, distraction-free user experience.

## Tech Stack
* **Frontend**: React, TypeScript, Vite
* **Backend**: Python, FastAPI, Pandas

---

## Getting Started

Clone the repository:
```bash
git clone https://github.com/p-art-dheev/nutrix.git
cd nutrix
```

This is a monorepo containing both the frontend and backend. You will need two terminal windows to run both servers simultaneously.

### Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher)
* [Python](https://www.python.org/) (v3.9 or higher)

### 1. Backend Setup (FastAPI)

Open a terminal and navigate to the backend directory:
```bash
cd backend
```

Create a virtual environment to keep dependencies isolated:
```bash
python -m venv venv
```

Activate the virtual environment:
* **Windows**:
  ```bash
  .\venv\Scripts\activate
  ```
* **macOS / Linux**:
  ```bash
  source venv/bin/activate
  ```

Install the required Python packages:
```bash
pip install -r requirements.txt
```

Start the FastAPI development server:
```bash
uvicorn app.main:app --reload
```
*The backend will now be running on `http://127.0.0.1:8000`. You can view the automatic API documentation at `http://127.0.0.1:8000/docs`.*

---

### 2. Frontend Setup (React + Vite)

Open a **new** terminal window and navigate to the frontend directory:
```bash
cd frontend
```

Install the required Node dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```
*The frontend will now be running on `http://localhost:5173`. Open this URL in your browser to use the application!*

---

## Usage
1. Open the frontend in your browser.
2. Click **[ Load Dataset ]** in the Hero section.
3. Upload your CSV files containing the food and nutrition data.
4. The backend will validate, process, and merge the datasets using Pandas.
5. Review the dataset statistics in the UI and proceed to optimization.
