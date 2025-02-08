# CMPE295-Autonomous-Detection
City streets face safety risks from road hazards, illegal encampments, and vandalism. Many cities lack real-time hazard detection, relying on slow inspections. This project uses AI and autonomous vehicle cameras to detect and report issues instantly. By analyzing road data, it helps cities prioritize repairs, improving safety and response times.

## Project Layout
```
CMPE295-Autonomous-Detection
│── backend/                # Backend (Python Flask)
│   ├── config/             # Configuration files
│   ├── routes/             # API routes
│   ├── static/             # Static files (CSS, JS, images)
│   ├── templates/          # HTML templates (for Flask if using Jinja2)
│   ├── venv/               # Virtual environment (Python dependencies)
│   ├── .env                # Environment variables
│   ├── .gitignore          # Git ignore rules for backend
│   ├── app.py              # Main backend application
│   ├── config.py           # Configuration settings
│   ├── requirements.txt    # Python dependencies
│
│── frontend/               # Frontend (React.js)
│   ├── node_modules/       # Installed npm packages
│   ├── public/             # Static public files (index.html, favicons)
│   ├── src/                # Main frontend source code
│   │   ├── assets/         # Images, fonts, and other assets
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page-level components (e.g., Home, About)
│   │   ├── utils/          # Utility functions/helpers
│   │   ├── App.css         # Global styles
│   │   ├── App.js          # Main React component
│   │   ├── index.css       # Main styles
│   │   ├── index.js        # React entry point
│   ├── .gitignore          # Git ignore rules for frontend
│   ├── package-lock.json   # Lockfile for npm dependencies
│   ├── package.json        # npm package metadata
│
│── README.md               # Project documentation
```
  
## To run React frontend locally:
- Install node.js. https://nodejs.org/en
- Run the following command to install the dependencies and neccessary files for this project.
```bash 
npm install
```
- Start your frontend with:
```bash 
npm start
``` 

## To run Flask backend locally:
- Create a python virtual environment and activate it:
For Windows:
```bash 
python -m venv venv
```
```bash
venv\Scripts\activate
```
For Mac:
```bash
python3 -m venv venv
```
```bash
source venv/bin/activate
```
- Install all packages with:
```bash
pip install -r requirements.txt
```
- start your backend with:
```bash
python app.py
```
