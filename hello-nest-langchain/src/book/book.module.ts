/*
 * @Author: jiangxin
 * @Date: 2026-07-31 16:19:10
 * @Company: orientsec.com.cn
 * @Description:
 */
import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';

@Module({
  controllers: [BookController],
  providers: [
    BookService,
    {
      provide: 'BOOK_REPOSITORY',
      useFactory() {
        const books = [
          {
            id: '1',
            title: 'book 1',
          },
          {
            id: '1',
            title: 'book 1',
          },
          {
            id: '1',
            title: 'book 1',
          },
        ];

        return {
          findAll: () => [...books],
        };
      },
    },
  ],
})
export class BookModule {}
