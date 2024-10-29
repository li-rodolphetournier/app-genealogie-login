import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const filePath = path.join(process.cwd(), 'src/data/genealogie.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const genealogyData = JSON.parse(fileData);
    
    res.status(200).json(genealogyData);
  } catch (error) {
    console.error('Error reading genealogy data:', error);
    res.status(500).json({ message: 'Error reading genealogy data' });
  }
} 