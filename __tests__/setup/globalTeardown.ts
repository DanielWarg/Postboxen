export default async () => {
  const g = global as any;
  if (g.__PG__) await g.__PG__.stop();
  if (g.__REDIS__) await g.__REDIS__.stop();
};
