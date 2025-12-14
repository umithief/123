# MotoVibe Deployment Guide

This guide explains how to deploy the MotoVibe application to Vercel (Frontend) and Render.com (Backend).

## 1. Backend Deployment (Render.com)

Since the frontend needs the backend URL to work, deploy the backend **first**.

1.  Push your code to a GitHub repository.
2.  Go to [dashboard.render.com](https://dashboard.render.com/).
3.  Click **New +** -> **Blueprint**.
4.  Connect your GitHub repository.
5.  Render will detect the `render.yaml` file and propose a new "Web Service".
6.  Click **Apply**.
7.  **Environment Variables**:
    You need to set the following environment variables in the Render Dashboard (under the "Environment" tab of your service):
    *   `MONGO_URI`: Your MongoDB Connection String (e.g., from MongoDB Atlas).
    *   `MINIO_ENDPOINT`: (Optional) URL of your S3/MinIO storage.
    *   `MINIO_ACCESS_KEY`: (Optional) Access key for storage.
    *   `MINIO_SECRET_KEY`: (Optional) Secret key for storage.
    
    > **Note on File Uploads**: If you don't provide a valid external MinIO/S3 service, file uploads will not work in production as Render's disk is ephemeral (files are lost on restart) and the local MinIO setup won't run there.

8.  Once deployed, copy the **Backend URL** (e.g., `https://motovibe-backend.onrender.com`).

---

## 2. Frontend Deployment (Vercel)

1.  Go to [vercel.com](https://vercel.com/) and log in.
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  **Framework Preset**: Vercel should automatically detect **Vite**.
5.  **Build Command**: `npm run build` (Default).
6.  **Output Directory**: `dist` (Default).
7.  **Environment Variables**:
    *   Click to expand the "Environment Variables" section.
    *   Add `VITE_API_URL`.
    *   Value: Your Render Backend URL + `/api` (e.g., `https://motovibe-backend.onrender.com/api`).
8.  Click **Deploy**.

## 3. Final Checks

*   Open your Vercel app URL.
*   Check the browser console (F12) to ensure it's connecting to the correct backend URL (not localhost).
*   If you see connection errors, ensure `VITE_API_URL` is set correctly in Vercel and you triggered a **Redeploy** after setting it.
