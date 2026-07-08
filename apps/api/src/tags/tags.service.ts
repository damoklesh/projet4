import { Injectable } from '@nestjs/common';
import { TagResponseDto } from './dto/tag.response';
import { TagsRepository } from './tags.repository';

@Injectable()
export class TagsService {
  constructor(private readonly tagsRepository: TagsRepository) {}

  async listForUser(userId: string): Promise<TagResponseDto[]> {
    const tags = await this.tagsRepository.findForUser(userId);

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      createdAt: tag.createdAt,
    }));
  }
}
