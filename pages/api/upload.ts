import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const form = formidable({
    multiples: true,
    keepExtensions: true,
  });

  try {
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const type = fields.type?.[0] || 'genealogie';
    const uploadDir = path.join(process.cwd(), `public/uploads/${type}-photo/profile`);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const file = files.file?.[0] || files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = `${Date.now()}-${path.basename(file.originalFilename || 'image')}`;
    const newPath = path.join(uploadDir, fileName);

    await fs.promises.copyFile(file.filepath, newPath);
    await fs.promises.unlink(file.filepath);

    const relativeFilePath = `/uploads/${type}-photo/profile/${fileName}`;
    return res.status(200).json({ url: relativeFilePath });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'File upload failed' });
  }
}
