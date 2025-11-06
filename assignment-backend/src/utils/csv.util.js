import { format } from 'fast-csv';

export const streamCsv = async (rows, res) => {
  const csvStream = format({ headers: true });
  csvStream.pipe(res);
  for (const r of rows) {
    csvStream.write({
      uid: r.uid,
      name: r.name,
      price: r.price,
      image: r.image || '',
      category: r.Category?.name || ''
    });
  }
  csvStream.end();
};
