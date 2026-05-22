import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  console.log('Testing client creation with new fields...');
  try {
    const data = {
      id: crypto.randomUUID(),
      name: 'Test Client Fields ' + Date.now(),
      canalOrigem: 'Instagram',
      responsavelInternoId: 'some-user-id',
      type: 'CLIENT',
    };

    const created = await prisma.client.create({
      data: data
    });
    console.log('Successfully created client with fields:', JSON.stringify(created, null, 2));

    if (created.canalOrigem === 'Instagram' && created.responsavelInternoId === 'some-user-id') {
      console.log('Verification SUCCESS: New fields saved correctly.');
    } else {
      console.error('Verification FAILURE: New fields NOT saved correctly.');
    }
  } catch (error) {
    console.error('Error creating client:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
