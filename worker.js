// Import necessary modules
import Queue from 'bull';
import { ObjectID } from 'mongodb';
import imageThumbnail from 'image-thumbnail';
import dbClient from './utils/db';
import { promises as fs } from 'fs';

// Create a new Bull queue named 'fileQueue'
const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');

// Process jobs in the 'fileQueue' queue
fileQueue.process(async (job) => {
  // Throw an error if 'fileId' is not present in the job data
  if (!job.data.fileId) throw new Error('Missing fileId');
  // Throw an error if 'userId' is not present in the job data
  if (!job.data.userId) throw new Error('Missing userId');

  // Get the 'files' collection from the database
  const files = dbClient.db.collection('files');
  // Find the file document in the database using 'fileId' and 'userId'
  const file = await files.findOne({ _id: new ObjectID(job.data.fileId), userId: new ObjectID(job.data.userId) });

  // Throw an error if the file document is not found
  if (!file) throw new Error('File not found');

  // Define the sizes for the thumbnails
  const sizes = [500, 250, 100];
  // Loop over the sizes array
  for (const size of sizes) {
    // Generate a thumbnail for the current size
    const thumbnail = await imageThumbnail(file.localPath, { width: size });
    // Write the thumbnail to a file
    await fs.writeFile(`${file.localPath}_${size}`, thumbnail);
  }
});
