import { Pipe, PipeTransform } from '@angular/core';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

@Pipe({ name: 'timeAgo', standalone: true })
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date | undefined | null): string {
    if (!value) return 'Nunca';
    try {
      return formatDistanceToNow(new Date(value), { locale: es, addSuffix: true });
    } catch {
      return 'Fecha inválida';
    }
  }
}
