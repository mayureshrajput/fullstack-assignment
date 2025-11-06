import XLSX from 'xlsx';
import stream from 'stream';

export const streamXlsx = async (rows, res) => {
  const data = rows.map(r => ({
    uid: r.uid,
    name: r.name,
    price: Number(r.price),
    image: r.image || '',
    category: r.Category?.name || ''
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  const pass = new stream.PassThrough();
  pass.end(buf);
  pass.pipe(res);
};
