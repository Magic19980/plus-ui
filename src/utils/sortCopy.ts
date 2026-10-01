/**
 * 返回排序后的新数组，不依赖较新的 Array.prototype.toSorted。
 * 归并排序同时保证相同键值保持原顺序，便于兼容旧浏览器和稳定渲染结果。
 */
export function sortCopy<T>(values: readonly T[], compare: (left: T, right: T) => number): T[] {
  const result = Array.from(values);
  const buffer = [] as T[];
  buffer.length = result.length;

  function mergeSort(start: number, end: number) {
    if (end - start < 2) return;
    const middle = start + Math.floor((end - start) / 2);
    mergeSort(start, middle);
    mergeSort(middle, end);

    let left = start;
    let right = middle;
    for (let index = start; index < end; index += 1) {
      if (left >= middle) {
        buffer[index] = result[right];
        right += 1;
      } else if (right >= end) {
        buffer[index] = result[left];
        left += 1;
      } else if (compare(result[left], result[right]) <= 0) {
        buffer[index] = result[left];
        left += 1;
      } else {
        buffer[index] = result[right];
        right += 1;
      }
    }
    for (let index = start; index < end; index += 1) result[index] = buffer[index];
  }

  mergeSort(0, result.length);
  return result;
}
