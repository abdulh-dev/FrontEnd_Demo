Here's a **cleaner, well-formatted version** of your setup instructions with clear steps, consistent formatting, and proper headings:

---

# 🚀 Project Setup Guide

This guide walks you through starting both the **FastAPI backend** and the **React frontend** for your demo project.

---

## 🧱 1. Check File Structure

In your root directory, run:

```bash
ls
```

You should see:

```
frontend
backend
```

---

## 🖥️ 2. Start the Backend (FastAPI)

### 🔹 Step 1: Navigate into the backend folder

```bash
cd backend
```

### 🔹 Step 2: Set up a virtual environment

```bash
python -m venv venv
venv\Scripts\activate     # On Windows
```

> 💡 If you're on macOS/Linux, use `source venv/bin/activate` instead.

### 🔹 Step 3: Install dependencies

```bash
pip install -r requirements.txt
```

### 🔹 Step 4: Run the FastAPI server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

✅ You should now see output showing that the FastAPI server is running at `http://127.0.0.1:8000`.

---

## 🌐 3. Start the Frontend (React)

Open a **new terminal**, and again:

```bash
ls
```

You should still see:

```
frontend
backend
```

### 🔹 Step 1: Navigate into the frontend folder

```bash
cd frontend
```

### 🔹 Step 2: Start the React app

```bash
npm start
```

✅ Your app should open at [http://localhost:3000](http://localhost:3000) in your browser.

---

## ✅ You're Ready!

Now your full-stack demo is running:

* **Backend API** on `http://localhost:8000`
* **Frontend UI** on `http://localhost:3000`

You can now interact with the chat assistant via the web interface.

