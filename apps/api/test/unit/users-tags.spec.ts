import { TagsRepository } from '../../src/tags/tags.repository';
import { TagsService } from '../../src/tags/tags.service';
import { UsersRepository } from '../../src/users/users.repository';
import { UsersService } from '../../src/users/users.service';

describe('UsersRepository', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds users by email', async () => {
    const repository = new UsersRepository(prisma as never);
    const user = createUser();
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(repository.findByEmail('user@example.com')).resolves.toBe(user);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });
  });

  it('creates users with email and password hash', async () => {
    const repository = new UsersRepository(prisma as never);
    const user = createUser();
    prisma.user.create.mockResolvedValue(user);

    await expect(repository.create({ email: 'user@example.com', passwordHash: 'hash' })).resolves.toBe(user);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'user@example.com',
        passwordHash: 'hash',
      },
    });
  });
});

describe('UsersService', () => {
  const repository = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates lookup and creation to UsersRepository', async () => {
    const service = new UsersService(repository as never);
    const user = createUser();
    repository.findByEmail.mockResolvedValue(user);
    repository.create.mockResolvedValue(user);

    await expect(service.findByEmail('user@example.com')).resolves.toBe(user);
    await expect(service.createUser('user@example.com', 'hash')).resolves.toBe(user);

    expect(repository.findByEmail).toHaveBeenCalledWith('user@example.com');
    expect(repository.create).toHaveBeenCalledWith({ email: 'user@example.com', passwordHash: 'hash' });
  });

  it('returns public user data without password fields', () => {
    const service = new UsersService(repository as never);

    expect(service.toPublicDto(createUser())).toEqual({
      id: 'user-id',
      email: 'user@example.com',
      avatar: null,
    });
  });
});

describe('TagsRepository', () => {
  it('lists user tags ordered by name', async () => {
    const prisma = {
      tag: {
        findMany: jest.fn(),
      },
    };
    const repository = new TagsRepository(prisma as never);
    prisma.tag.findMany.mockResolvedValue([]);

    await expect(repository.findForUser('user-id')).resolves.toEqual([]);

    expect(prisma.tag.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
      orderBy: { name: 'asc' },
    });
  });
});

describe('TagsService', () => {
  it('maps persisted tags to response DTOs', async () => {
    const createdAt = new Date('2026-07-08T10:30:00.000Z');
    const repository = {
      findForUser: jest.fn().mockResolvedValue([
        {
          id: 'tag-id',
          userId: 'user-id',
          name: 'facture',
          createdAt,
        },
      ]),
    };
    const service = new TagsService(repository as never);

    await expect(service.listForUser('user-id')).resolves.toEqual([
      {
        id: 'tag-id',
        name: 'facture',
        createdAt,
      },
    ]);
  });
});

function createUser() {
  return {
    id: 'user-id',
    email: 'user@example.com',
    passwordHash: 'hash',
    avatar: null,
    createdAt: new Date('2026-07-08T10:30:00.000Z'),
    updatedAt: new Date('2026-07-08T10:30:00.000Z'),
  };
}
