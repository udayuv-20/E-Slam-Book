# E-Slam Book

A digital slam book. Create a notebook, pass the pages around, and keep every nickname, memory, and note your friends write back.

Books are saved in Firebase for project `e-slam-book-9006c`. Copy a book link when you want a friend to sign the same pages. Download a backup when you want a file of your own.

Before the shelf can load from the cloud, create a Firestore database in the Firebase console and publish `firestore.rules`.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints, usually http://localhost:5173.

## What's inside

- A shelf of slam books, each with its own cover
- Classic pages: favorites, a memory, and a note
- A filled sample book so you can turn the pages first
- Backup and restore as a JSON file
