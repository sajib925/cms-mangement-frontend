import fs from 'fs';

const filePath = './dist/index.html'; 

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    throw err;
  }

  const modifiedData = data.replace(/href="\/|src="\/|type="module" crossorigin src="\/|href="\//g, (match) => {
    return match.replace(/\//g, '');
  });

  fs.writeFile(filePath, modifiedData, 'utf8', (err) => {
    if (err) {
      throw err;
    }
  });
});