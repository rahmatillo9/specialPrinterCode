export class OrderDto {
  id: number;
  tableId: number;
  items: { name: string; quantity: number }[];
  status: string;
}
