# MongoDB Setup Guide

You have two options to run MongoDB. Choose **Option A (Docker)** if you want a clean, isolated setup, or **Option B (Local)** if you prefer running it directly on your machine.

## Option A: Using Docker (Recommended)
Since you have Docker installed, this is the easiest method.

1.  **Open a Terminal** in the project root (`c:\Users\gsai4\Pictures\under construction\TCM\TCM`).
2.  **Run the following command**:
    ```powershell
    docker-compose up -d
    ```
3.  **Verify**: Run `docker ps` and ensure `tcm_mongodb` is listed.

## Option B: Using Local MongoDB
Since you have MongoDB installed locally:

1.  **Create a Data Directory** (if not already created):
    ```powershell
    mkdir c:\data\db
    ```
2.  **Start MongoDB**:
    Open a *new* terminal window and run:
    ```powershell
    mongod --dbpath="c:\data\db"
    ```
    *Keep this terminal open while working.*

## Option C: MongoDB Atlas (Cloud)
If you prefer a cloud database:

1.  Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Get your connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/...`).
3.  Update your `backend/.env` file:
    ```env
    MONGODB_URI=your_connection_string_here
    ```

## Verification
Once MongoDB is running (via Docker or Local):
1.  Restart your backend server:
    ```powershell
    cd backend
    node server.js
    ```
2.  You should see: `✅ MongoDB Connected: ...`
