# TCM Project Installation Guide

Welcome! Follow these steps to set up the TCM project on your machine.

## Prerequisites

Before you begin, make sure you have the following installed:

1.  **Node.js**: Download and install from [nodejs.org](https://nodejs.org/). (Version 18+ recommended)
2.  **MongoDB**: Make sure you have a local MongoDB instance running or a connection string for MongoDB Atlas.

## One-Click Setup (Recommended)

### Windows
1.  Double-click the `setup.bat` file in the root directory.
2.  This will automatically install all dependencies for both the frontend and backend.

### Mac / Linux
1.  Open a terminal in the project folder.
2.  Run the following command:
    ```bash
    chmod +x setup.sh && ./setup.sh
    ```

## Manual Setup

If the scripts don't work, you can install dependencies manually:

1.  **Frontend**:
    ```bash
    npm install
    ```
2.  **Backend**:
    ```bash
    cd backend
    npm install
    ```

## Running the Application

To start the project, you need two terminals:

**Terminal 1 (Frontend):**
```bash
npm run dev
```

**Terminal 2 (Backend):**
```bash
cd backend
npm start
```

## VS Code Recommended Extensions

If you are using VS Code, you will see a popup recommending extensions like ESLint, Prettier, and MongoDB. It is highly recommended to install them for the best development experience.
