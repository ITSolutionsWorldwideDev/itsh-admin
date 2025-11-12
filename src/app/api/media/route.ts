// src/app/api/media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyJWT, AuthTokenPayload } from "@/lib/auth";
import pool from "@/lib/db";
import fs from "fs";
import path from "path";
import { Storage } from "@google-cloud/storage";
// import { mkdir } from "fs/promises";

// const uploadDir = path.join(process.cwd(), "public", "uploads");

// async function ensureDirExists(dirPath: string) {
//   if (!fs.existsSync(dirPath)) {
//     await mkdir(dirPath, { recursive: true });
//   }
// }

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

const bucketName = process.env.GCP_BUCKET_NAME!;
const bucket = storage.bucket(bucketName);

// --------------------------
// GET - List or Single Media
// --------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const result = await pool.query(
        `SELECT media_id, file_name, file_path, file_type, created_at
         FROM media
         WHERE media_id = $1`,
        [id],
      );

      if (!result.rows.length) return NextResponse.json(null, { status: 404 });

      const row = result.rows[0];
      const file = bucket.file(row.file_path);
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      });

      row.file_path = signedUrl;

      return NextResponse.json(row || null, {
        status: result.rows.length ? 200 : 404,
      });
    }

    // List all media
    const result = await pool.query(
      `SELECT media_id, file_name, file_path, file_type, created_at
       FROM media
       ORDER BY created_at DESC`,
    );

    const rows = result.rows;

    // Generate signed URLs for all media
    for (const row of rows) {
      const file = bucket.file(row.file_path);
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
      });
      row.file_path = signedUrl;
    }

    return NextResponse.json(rows);

  } catch (err) {
    console.error("GET /api/media error:", err);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 },
    );
  }
}

// --------------------------
// POST - Upload Media File
// --------------------------
export async function POST(req: NextRequest) {
  try {
    const token =
      req.cookies.get("token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");
    const user = verifyJWT(token || "") as AuthTokenPayload | null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const module_ref = (formData.get("module_ref") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const gcsPath = `${module_ref}/${fileName}`;

    const fileUpload = bucket.file(gcsPath);

    // Save the file without legacy ACL
    await fileUpload.save(buffer, {
      contentType: file.type,
      resumable: false,
    });

    // Generate a signed URL valid for 1 year
    // const [signedUrl] = await fileUpload.getSignedUrl({
    //   action: "read",
    //   expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
    // });


    // const buffer = Buffer.from(await file.arrayBuffer());
    // const ext = path.extname(file.name);
    // const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    // const modulePath = path.join(uploadDir, module_ref);
    // await ensureDirExists(modulePath);

    // const filePath = path.join(modulePath, fileName);
    // await fs.promises.writeFile(filePath, buffer);

    // const dbPath = `/uploads/${module_ref}/${fileName}`;
    // console.log('gcsPath === ', gcsPath);

    const result = await pool.query(
      `INSERT INTO media (file_name, file_path, file_type, module_ref, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [fileName, gcsPath, file.type, module_ref, user.id],
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}

// --------------------------
// DELETE - Delete Media File (Google Cloud Storage)
// --------------------------
export async function DELETE(req: NextRequest) {
  try {
    const token =
      req.cookies.get("token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    const user = verifyJWT(token || "") as AuthTokenPayload | null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing media ID" }, { status: 400 });
    }

    // Find the media record
    const result = await pool.query(`SELECT * FROM media WHERE media_id = $1`, [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const media = result.rows[0];
    const gcsFilePath = media.file_path; // assuming this is the path within the bucket

    // Delete file from Google Cloud Storage
    const file = bucket.file(gcsFilePath);

    try {
      await file.delete();
      console.log(`Deleted file from GCS: ${gcsFilePath}`);
    } catch (err: any) {
      if (err.code === 404) {
        console.warn("File not found in GCS, proceeding to delete DB record");
      } else {
        console.error("GCS delete error:", err);
        return NextResponse.json(
          { error: "Failed to delete file from Google Cloud Storage" },
          { status: 500 },
        );
      }
    }

    // Delete from database
    await pool.query(`DELETE FROM media WHERE media_id = $1`, [id]);

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/media error:", err);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 },
    );
  }
}

/* export async function DELETE(req: NextRequest) {
  try {
    const token =
      req.cookies.get("token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    const user = verifyJWT(token || "") as AuthTokenPayload | null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json({ error: "Missing media ID" }, { status: 400 });

    const result = await pool.query(`SELECT * FROM media WHERE media_id = $1`, [
      id,
    ]);
    if (result.rows.length === 0)
      return NextResponse.json({ error: "Media not found" }, { status: 404 });

    const media = result.rows[0];
    const filePath = path.join(process.cwd(), "public", media.file_path);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }

    await pool.query(`DELETE FROM media WHERE media_id = $1`, [id]);

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 },
    );
  }
} */
