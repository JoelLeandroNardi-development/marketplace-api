import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

export class QueryProductsDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional({ default: '1' })
    @IsOptional()
    @IsNumberString()
    page?: string = '1';

    @ApiPropertyOptional({ default: '10' })
    @IsOptional()
    @IsNumberString()
    limit?: string = '10';
}