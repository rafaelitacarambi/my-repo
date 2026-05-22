import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  console.log('Testing client creation...');
  try {
    const data = {
      id: crypto.randomUUID(),
      name: 'Test Client ' + Date.now(),
      email: 'test' + Date.now() + '@example.com',
      phone: '123456789',
      document: 'DOC' + Date.now(),
      type: 'CLIENT',
      status: 'Ativo',
      papeis: 'Locatário',
      notes: 'Test note',
    };

    const created = await prisma.client.create({
      data: data
    });
    console.log('Successfully created client:', created);
  } catch (error) {
    console.error('Error creating client:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
