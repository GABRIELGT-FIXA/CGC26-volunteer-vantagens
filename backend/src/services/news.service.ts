import prisma from '../config/prisma';

const newsSelect = {
  id: true, title: true, description: true, image: true,
  createdById: true, createdAt: true, updatedAt: true,
  createdBy: { select: { id: true, fullName: true } },
};

export async function listNews() {
  return prisma.news.findMany({ select: newsSelect, orderBy: { createdAt: 'desc' } });
}

export async function getNews(id: string) {
  const news = await prisma.news.findUnique({ where: { id }, select: newsSelect });
  if (!news) throw Object.assign(new Error('Notícia não encontrada'), { status: 404 });
  return news;
}

export async function createNews(data: {
  title: string; description: string; image?: string; createdById: string;
}) {
  return prisma.news.create({ data, select: newsSelect });
}

export async function updateNews(id: string, data: {
  title?: string; description?: string; image?: string;
}) {
  await getNews(id);
  return prisma.news.update({ where: { id }, data, select: newsSelect });
}

export async function deleteNews(id: string) {
  await getNews(id);
  await prisma.news.delete({ where: { id } });
}
