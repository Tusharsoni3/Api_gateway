import express from 'express';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fake-service' });
});

app.get('/users', (_req, res) => {
  res.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ]);
});

app.get('/products', (_req, res) => {
  res.json([
    { id: 1, name: 'Widget', price: 9.99 },
    { id: 2, name: 'Gadget', price: 19.99 },
  ]);
});

app.post('/orders', (req, res) => {
  res.status(201).json({ id: 42, ...req.body, status: 'created' });
});

app.all('/{*path}', (req, res) => {
  res.json({
    message: 'Fake service received your request',
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
  });
});

app.listen(PORT, () => {
  console.log(`fake-service running at http://localhost:${PORT}`);
});
