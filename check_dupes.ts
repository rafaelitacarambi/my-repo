import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const emptyDocs = await prisma.client.findMany({
      where: { document: '' }
    });
    console.log('Clients with empty document (empty string):', emptyDocs.length);
    
    const nullDocs = await prisma.client.findMany({
      where: { document: null }
    });
    console.log('Clients with null document:', nullDocs.length);

    const allDocs = await prisma.client.findMany({
      select: { document: true }
    });
    const dupes = allDocs.filter(d => d.document).map(d => d.document);
    const uniqueDupes = dupes.filter((item, index) => dupes.indexOf(item) !== index);
    console.log('Duplicate documents (excluding null/empty):', JSON.stringify(uniqueDupes));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
