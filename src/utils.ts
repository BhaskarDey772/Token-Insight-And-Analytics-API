export function groupByDate<T extends { time: number }>(
    items: T[]
  ): Record<string, T[]> {
    return items.reduce((acc, item) => {
      const key = new Date(item.time).toISOString().slice(0, 10);
      acc[key] ||= [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }
  
  export function round(n: number) {
    return Number(n.toFixed(2));
  }