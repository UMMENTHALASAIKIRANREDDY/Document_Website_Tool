# DocProject - PDF Document Display Website

A React + Node.js web application that lets you upload PDF documents and display their extracted content in a professional table format. Share the URL with clients to give them access.

## Quick Start

### 1. Install Dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 2. Run the Application

Open two terminals:

**Terminal 1 - Start the server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Start the client:**
```bash
cd client
npm run dev
```

The app will be available at **http://localhost:3000**

### 3. Upload a PDF

1. Navigate to **http://localhost:3000/upload**
2. Select a category group (e.g., "MESSAGE COMBINATIONS")
3. Enter a category name (e.g., "Slack to Chat")
4. Upload your PDF file
5. Review and edit the extracted features
6. Click "Save & View"

## Project Structure

```
DocProject/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── components/
│       └── index.css
├── server/          # Node.js backend (Express)
│   ├── assets/      # All uploaded files and data stored here
│   │   ├── data.json       # All content as JSON (no database)
│   │   ├── pdfs/           # Uploaded PDF files
│   │   └── screenshots/    # Uploaded screenshot images
│   ├── routes/
│   └── utils/
└── README.md
```

## How It Works

- **No database** - All data is stored in `server/assets/data.json`
- PDFs are uploaded and parsed to extract text content
- Extracted features can be edited before saving
- Screenshots can be added to individual features
- The sidebar navigation is auto-generated from uploaded categories
